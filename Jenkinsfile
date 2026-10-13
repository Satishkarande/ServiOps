pipeline {
    agent any

    stages {

        stage('Environment Info') {
            steps {
                sh '''
                    echo "Job Name: $JOB_NAME"
                    echo "Build Number: $BUILD_NUMBER"
                    echo "Workspace: $WORKSPACE"
                    echo "Git Commit: $GIT_COMMIT"
                    echo "Node: $NODE_NAME"
                '''
            }
        }

        stage('Docker Check') {
            steps {
                sh '''
                    whoami
                    docker --version
                    docker ps
                '''
            }
        }

        stage('Backend Validation') {
            steps {
                sh '''
                    python3 -m compileall backend/app
                '''
            }
        }

        stage('Frontend Dependencies') {
            steps {
                sh '''
                    cd frontend
                    npm ci
                '''
            }
        }

        stage('Frontend Lint') {
            steps {
                sh '''
                    cd frontend
                    npm run lint
                '''
            }
        }

        stage('Frontend Build') {
            steps {
                sh '''
                    cd frontend
                    npm run build
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -eu

                    echo "===== Building Backend Docker Image ====="
                    docker build -t serviops-backend:${BUILD_NUMBER} ./backend

                    echo "===== Building Frontend Docker Image ====="
                    docker build -t serviops-frontend:${BUILD_NUMBER} ./frontend

                    echo "===== Docker Images Built ====="
                    docker images serviops-backend
                    docker images serviops-frontend
                '''
            }
        }

        stage('Push Docker Images to ECR') {
            steps {
                sh '''
                    set -eu

                    REGION="ap-south-1"
                    ECR_REGISTRY="373220260877.dkr.ecr.ap-south-1.amazonaws.com"

                    echo "===== Logging in to Amazon ECR ====="

                    aws ecr get-login-password --region "$REGION" |
                        docker login --username AWS --password-stdin "$ECR_REGISTRY"

                    echo "===== Tagging Backend Image ====="

                    docker tag "serviops-backend:${BUILD_NUMBER}" \
                        "$ECR_REGISTRY/serviops-backend:${BUILD_NUMBER}"

                    echo "===== Tagging Frontend Image ====="

                    docker tag "serviops-frontend:${BUILD_NUMBER}" \
                        "$ECR_REGISTRY/serviops-frontend:${BUILD_NUMBER}"

                    echo "===== Pushing Backend Image ====="

                    docker push "$ECR_REGISTRY/serviops-backend:${BUILD_NUMBER}"

                    echo "===== Pushing Frontend Image ====="

                    docker push "$ECR_REGISTRY/serviops-frontend:${BUILD_NUMBER}"

                    echo "===== ECR Push Completed ====="
                '''
            }
        }

        stage('Deploy to AWS EC2 via SSM') {
            steps {
                sh '''
                    set -eu

                    REGION="ap-south-1"
                    INSTANCE_ID="i-00ea3a0f181c9dade"
                    ECR_REGISTRY="373220260877.dkr.ecr.ap-south-1.amazonaws.com"
                    DEPLOY_FILE="$(mktemp)"

                    cleanup() {
                        rm -f "$DEPLOY_FILE"
                    }

                    trap cleanup EXIT

                    echo "===== Starting ServiOps Deployment ====="
                    echo "Build Number: ${BUILD_NUMBER}"

                    cat > "$DEPLOY_FILE" <<EOF
{
  "commands": [
    "set -eu",
    "export AWS_DEFAULT_REGION=${REGION}",
    "export IMAGE_TAG=${BUILD_NUMBER}",
    "echo '===== Logging in to ECR ====='",
    "aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}",
    "cd /home/ubuntu/ServiOps",
    "echo '===== Checking Compose Configuration ====='",
    "docker compose -f docker-compose.deploy.yml config -q",
    "echo '===== Pulling Backend and Frontend Images ====='",
    "docker compose -f docker-compose.deploy.yml pull backend frontend",
    "echo '===== Updating Backend and Frontend ====='",
    "docker compose -f docker-compose.deploy.yml up -d --no-deps backend frontend",
    "echo '===== Checking Container Status ====='",
    "docker compose -f docker-compose.deploy.yml ps"
  ]
}
EOF

                    echo "===== Sending Deployment Command Through SSM ====="

                    COMMAND_ID=$(/usr/local/bin/aws ssm send-command \
                        --region "$REGION" \
                        --instance-ids "$INSTANCE_ID" \
                        --document-name "AWS-RunShellScript" \
                        --comment "ServiOps deployment build ${BUILD_NUMBER}" \
                        --parameters "file://${DEPLOY_FILE}" \
                        --query 'Command.CommandId' \
                        --output text)

                    if [ -z "$COMMAND_ID" ] || [ "$COMMAND_ID" = "None" ]; then
                        echo "ERROR: Failed to submit deployment command."
                        exit 1
                    fi

                    echo "SSM Command ID: $COMMAND_ID"
                    echo "===== Waiting for Deployment ====="

                    ATTEMPTS=0
                    MAX_ATTEMPTS=60
                    STATUS="Pending"

                    while [ "$ATTEMPTS" -lt "$MAX_ATTEMPTS" ]; do

                        STATUS=$(/usr/local/bin/aws ssm get-command-invocation \
                            --region "$REGION" \
                            --command-id "$COMMAND_ID" \
                            --instance-id "$INSTANCE_ID" \
                            --query 'Status' \
                            --output text 2>/dev/null || echo "Pending")

                        echo "Deployment status: $STATUS"

                        case "$STATUS" in
                            Success)
                                break
                                ;;
                            Failed|Cancelled|TimedOut|Cancelling)
                                echo "ERROR: Deployment failed."
                                /usr/local/bin/aws ssm get-command-invocation \
                                    --region "$REGION" \
                                    --command-id "$COMMAND_ID" \
                                    --instance-id "$INSTANCE_ID" \
                                    --output json || true
                                exit 1
                                ;;
                        esac

                        ATTEMPTS=$((ATTEMPTS + 1))
                        sleep 5
                    done

                    if [ "$STATUS" != "Success" ]; then
                        echo "ERROR: Deployment did not finish within the polling period."

                        /usr/local/bin/aws ssm get-command-invocation \
                            --region "$REGION" \
                            --command-id "$COMMAND_ID" \
                            --instance-id "$INSTANCE_ID" \
                            --output json || true

                        exit 1
                    fi

                    echo "===== Deployment Command Output ====="

                    /usr/local/bin/aws ssm get-command-invocation \
                        --region "$REGION" \
                        --command-id "$COMMAND_ID" \
                        --instance-id "$INSTANCE_ID" \
                        --query '{Status:Status,Output:StandardOutputContent,Errors:StandardErrorContent}' \
                        --output json

                    echo "===== Deployment Commands Completed ====="
                '''
            }
        }

        stage('Application Health Check') {
            steps {
                sh '''
                    set -eu

                    echo "===== Checking ServiOps Health Endpoint ====="

                    ATTEMPTS=0
                    MAX_ATTEMPTS=12

                    while [ "$ATTEMPTS" -lt "$MAX_ATTEMPTS" ]; do

                        if curl --fail --silent --show-error \
                            --output /dev/null \
                            --connect-timeout 5 \
                            --max-time 10 \
                            https://serviops.xyz/health; then

                            echo "ServiOps health endpoint responded successfully."
                            exit 0
                        fi

                        ATTEMPTS=$((ATTEMPTS + 1))
                        echo "Health check attempt $ATTEMPTS/$MAX_ATTEMPTS failed."

                        sleep 5
                    done

                    echo "ERROR: ServiOps health check failed."
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'ServiOps CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'ServiOps CI/CD pipeline failed. Check the failed stage and console output.'
        }

        always {
            echo 'ServiOps pipeline execution finished.'
        }
    }
}