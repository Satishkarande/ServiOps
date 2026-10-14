pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '373220260877.dkr.ecr.ap-south-1.amazonaws.com'
        APP_INSTANCE_ID = 'i-00ea3a0f181c9dade'
        APP_HEALTH_URL = 'https://serviops.xyz/health'
    }

    stages {

        stage('Environment Info') {
            steps {
                sh '''
                    set -eu
                    echo "Job: $JOB_NAME"
                    echo "Build: $BUILD_NUMBER"
                    echo "Workspace: $WORKSPACE"
                    echo "Commit: $GIT_COMMIT"
                    echo "Agent: $NODE_NAME"
                '''
            }
        }

        stage('Docker Check') {
            steps {
                sh '''
                    set -eu
                    docker --version
                    docker ps
                '''
            }
        }

        stage('Backend Validation') {
            steps {
                sh 'python3 -m compileall backend/app'
            }
        }

        stage('Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend Lint') {
            steps {
                dir('frontend') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -eu

                    docker build \
                        -t "serviops-backend:${BUILD_NUMBER}" \
                        ./backend

                    docker build \
                        -t "serviops-frontend:${BUILD_NUMBER}" \
                        ./frontend

                    docker image inspect \
                        "serviops-backend:${BUILD_NUMBER}" >/dev/null

                    docker image inspect \
                        "serviops-frontend:${BUILD_NUMBER}" >/dev/null

                    echo "Both Docker images built successfully."
                '''
            }
        }

        stage('Push Docker Images to ECR') {
            steps {
                sh '''
                    set -eu

                    aws ecr get-login-password --region "$AWS_REGION" |
                        docker login \
                            --username AWS \
                            --password-stdin "$ECR_REGISTRY"

                    docker tag \
                        "serviops-backend:${BUILD_NUMBER}" \
                        "${ECR_REGISTRY}/serviops-backend:${BUILD_NUMBER}"

                    docker tag \
                        "serviops-frontend:${BUILD_NUMBER}" \
                        "${ECR_REGISTRY}/serviops-frontend:${BUILD_NUMBER}"

                    docker push \
                        "${ECR_REGISTRY}/serviops-backend:${BUILD_NUMBER}"

                    docker push \
                        "${ECR_REGISTRY}/serviops-frontend:${BUILD_NUMBER}"

                    echo "Both images pushed successfully to ECR."
                '''
            }
        }

        stage('Clean Jenkins Application Images') {
            steps {
                sh '''
                    set -eu

                    echo "Removing local image tags for build ${BUILD_NUMBER}."

                    for image in \
                        "serviops-backend:${BUILD_NUMBER}" \
                        "${ECR_REGISTRY}/serviops-backend:${BUILD_NUMBER}" \
                        "serviops-frontend:${BUILD_NUMBER}" \
                        "${ECR_REGISTRY}/serviops-frontend:${BUILD_NUMBER}"
                    do
                        if docker image inspect "$image" >/dev/null 2>&1; then
                            docker image rm "$image" ||
                                echo "Could not remove local tag: $image"
                        fi
                    done

                    echo "Jenkins application image cleanup completed."
                '''
            }
        }

        stage('Deploy with Automatic Rollback') {
            steps {
                script {
                    def remoteScript = '''#!/bin/bash
set -Eeuo pipefail

REGION="ap-south-1"
ECR_REGISTRY="373220260877.dkr.ecr.ap-south-1.amazonaws.com"
DEPLOY_DIR="/home/ubuntu/ServiOps"
STATE_FILE="$DEPLOY_DIR/.last-successful-deployment"
HEALTH_URL="https://serviops.xyz/health"
NEW_TAG="__BUILD_NUMBER__"

cd "$DEPLOY_DIR"

# Prevent concurrent deployments from modifying the same application.
exec 9>/var/lock/serviops-deploy.lock

if ! flock -n 9; then
    echo "ERROR: Another ServiOps deployment is running."
    exit 1
fi

# Read the previously successful deployment.
if [ ! -s "$STATE_FILE" ]; then
    echo "ERROR: Deployment state file is missing or empty."
    exit 1
fi

PREVIOUS_TAG="$(cat "$STATE_FILE")"

if ! [[ "$PREVIOUS_TAG" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid previous deployment tag: $PREVIOUS_TAG"
    exit 1
fi

if ! [[ "$NEW_TAG" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid new deployment tag: $NEW_TAG"
    exit 1
fi

if [ "$NEW_TAG" = "$PREVIOUS_TAG" ]; then
    echo "ERROR: New and previous version tags are identical."
    exit 1
fi

echo "Previous successful version: $PREVIOUS_TAG"
echo "New version: $NEW_TAG"

# Authenticate to ECR using the application EC2 instance role.
if ! aws ecr get-login-password --region "$REGION" |
     docker login --username AWS --password-stdin "$ECR_REGISTRY"; then
    echo "ERROR: ECR authentication failed."
    exit 1
fi

# Check that the previous version can be retrieved before deployment.
if ! docker pull "$ECR_REGISTRY/serviops-backend:$PREVIOUS_TAG"; then
    echo "ERROR: Previous backend image is unavailable."
    exit 1
fi

if ! docker pull "$ECR_REGISTRY/serviops-frontend:$PREVIOUS_TAG"; then
    echo "ERROR: Previous frontend image is unavailable."
    exit 1
fi

# Restore the previous version and verify its health.
rollback() {
    echo "===== ROLLBACK STARTED ====="
    echo "Restoring version: $PREVIOUS_TAG"

    export IMAGE_TAG="$PREVIOUS_TAG"

    if ! docker compose -f docker-compose.deploy.yml config -q; then
        echo "CRITICAL: Previous Compose configuration is invalid."
        return 1
    fi

    if ! docker compose -f docker-compose.deploy.yml up -d --no-deps backend frontend; then
        echo "CRITICAL: Could not restore the previous containers."
        return 1
    fi

    for attempt in $(seq 1 12); do
        if curl --fail --silent \
            --connect-timeout 5 \
            --max-time 10 \
            "$HEALTH_URL" >/dev/null; then

            echo "Rollback health check succeeded."
            echo "Restored version: $PREVIOUS_TAG"
            return 0
        fi

        echo "Rollback health check attempt $attempt/12 failed."
        sleep 5
    done

    echo "CRITICAL: Rollback health check failed."
    return 1
}

# Deploy both new application images.
deploy_new_version() {
    export IMAGE_TAG="$NEW_TAG"

    echo "Validating Compose configuration."

    if ! docker compose -f docker-compose.deploy.yml config -q; then
        echo "ERROR: New Compose configuration is invalid."
        return 1
    fi

    echo "Pulling new backend and frontend images."

    if ! docker compose -f docker-compose.deploy.yml pull backend frontend; then
        echo "ERROR: Could not pull the new application images."
        return 1
    fi

    echo "Starting new backend and frontend containers."

    if ! docker compose -f docker-compose.deploy.yml up -d --no-deps backend frontend; then
        echo "ERROR: Could not deploy the new application version."
        return 1
    fi

    echo "Checking the application health endpoint."

    for attempt in $(seq 1 12); do
        if curl --fail --silent \
            --connect-timeout 5 \
            --max-time 10 \
            "$HEALTH_URL" >/dev/null; then

            echo "New version passed its health check."
            return 0
        fi

        echo "Health check attempt $attempt/12 failed."
        sleep 5
    done

    echo "ERROR: New version failed its health check."
    return 1
}

# Any deployment failure triggers restoration of the previous version.
if ! deploy_new_version; then
    if rollback; then
        echo "Deployment failed, but the previous version was restored."
        exit 1
    else
        echo "CRITICAL: Deployment and rollback both failed."
        exit 2
    fi
fi

# Record the new version only after the health check succeeds.
TEMP_STATE="$(mktemp "$DEPLOY_DIR/.deployment-state.XXXXXX")"

if ! printf '%s\n' "$NEW_TAG" > "$TEMP_STATE"; then
    rm -f "$TEMP_STATE"
    echo "ERROR: Could not write deployment state."
    if rollback; then
        exit 1
    else
        exit 2
    fi
fi

if ! chmod 644 "$TEMP_STATE" ||
   ! mv -f "$TEMP_STATE" "$STATE_FILE"; then

    rm -f "$TEMP_STATE"
    echo "ERROR: Could not update deployment state."

    if rollback; then
        exit 1
    else
        exit 2
    fi
fi

echo "Recorded successful deployment: $NEW_TAG"

# Keep the current and previous application versions locally.
# Remove only older images belonging to the two ServiOps ECR repositories.
# Never remove volumes or unrelated Docker images.
for repository in \
    "$ECR_REGISTRY/serviops-backend" \
    "$ECR_REGISTRY/serviops-frontend"
do
    while IFS= read -r tag; do
        [ -n "$tag" ] || continue

        if [ "$tag" != "$NEW_TAG" ] &&
           [ "$tag" != "$PREVIOUS_TAG" ]; then

            if ! docker image rm "$repository:$tag"; then
                echo "Keeping $repository:$tag because Docker could not remove it."
            fi
        fi
    done < <(docker image ls "$repository" --format '{{.Tag}}')
done

echo "===== DEPLOYMENT SUCCESSFUL ====="
echo "Current version: $NEW_TAG"
echo "Previous version: $PREVIOUS_TAG"
'''

                    remoteScript = remoteScript.replace(
                        '__BUILD_NUMBER__',
                        env.BUILD_NUMBER
                    )

                    writeFile(
                        file: 'serviops-deploy.sh',
                        text: remoteScript
                    )

                    sh '''#!/bin/bash
set -euo pipefail

DEPLOY_FILE="$(mktemp)"
trap 'rm -f "$DEPLOY_FILE"' EXIT

# JSON-encode the complete remote script for the SSM API.
python3 - "$WORKSPACE/serviops-deploy.sh" "$DEPLOY_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as source:
    script = source.read()

with open(sys.argv[2], "w", encoding="utf-8") as destination:
    json.dump({"commands": [script]}, destination)
PY

COMMAND_ID=$(/usr/local/bin/aws ssm send-command \
    --region "$AWS_REGION" \
    --instance-ids "$APP_INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "ServiOps deployment build ${BUILD_NUMBER}" \
    --parameters "file://${DEPLOY_FILE}" \
    --query 'Command.CommandId' \
    --output text)

if [ -z "$COMMAND_ID" ] || [ "$COMMAND_ID" = "None" ]; then
    echo "ERROR: Could not submit the deployment command."
    exit 1
fi

echo "SSM Command ID: $COMMAND_ID"

ATTEMPTS=0
MAX_ATTEMPTS=120
STATUS="Pending"

while [ "$ATTEMPTS" -lt "$MAX_ATTEMPTS" ]; do
    STATUS=$(/usr/local/bin/aws ssm get-command-invocation \
        --region "$AWS_REGION" \
        --command-id "$COMMAND_ID" \
        --instance-id "$APP_INSTANCE_ID" \
        --query 'Status' \
        --output text 2>/dev/null || true)

    echo "Remote deployment status: $STATUS"

    case "$STATUS" in
        Success)
            /usr/local/bin/aws ssm get-command-invocation \
                --region "$AWS_REGION" \
                --command-id "$COMMAND_ID" \
                --instance-id "$APP_INSTANCE_ID" \
                --query '{Status:Status,Output:StandardOutputContent,Errors:StandardErrorContent}' \
                --output json

            exit 0
            ;;

        Failed|Cancelled|TimedOut|Cancelling|Undeliverable|Terminated|DeliveryTimedOut|ExecutionTimedOut)
            /usr/local/bin/aws ssm get-command-invocation \
                --region "$AWS_REGION" \
                --command-id "$COMMAND_ID" \
                --instance-id "$APP_INSTANCE_ID" \
                --output json || true

            echo "ERROR: Remote deployment or rollback failed."
            exit 1
            ;;
    esac

    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 5
done

echo "ERROR: Timed out waiting for the SSM command."
echo "Check the SSM invocation status before attempting another deployment."
exit 1
'''
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    #!/bin/bash
                    set +e

                    # Remove only this build's application image tags.
                    # This also cleans up if the pipeline fails after building.
                    if command -v docker >/dev/null 2>&1; then
                        for image in \
                            "serviops-backend:${BUILD_NUMBER}" \
                            "${ECR_REGISTRY}/serviops-backend:${BUILD_NUMBER}" \
                            "serviops-frontend:${BUILD_NUMBER}" \
                            "${ECR_REGISTRY}/serviops-frontend:${BUILD_NUMBER}"
                        do
                            docker image rm "$image" >/dev/null 2>&1 || true
                        done
                    fi
                '''
            }

            echo 'ServiOps pipeline execution finished.'
        }

        success {
            echo 'ServiOps CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'ServiOps CI/CD pipeline failed. Review the console output.'
        }
    }
}
