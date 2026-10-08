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
                sh 'python3 -m compileall backend/app'
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
            echo "===== Logging in to Amazon ECR ====="

            aws ecr get-login-password --region ap-south-1 | \
            docker login --username AWS --password-stdin \
            373220260877.dkr.ecr.ap-south-1.amazonaws.com

            echo "===== Tagging Backend Image ====="

            docker tag serviops-backend:${BUILD_NUMBER} \
            373220260877.dkr.ecr.ap-south-1.amazonaws.com/serviops-backend:${BUILD_NUMBER}

            echo "===== Tagging Frontend Image ====="

            docker tag serviops-frontend:${BUILD_NUMBER} \
            373220260877.dkr.ecr.ap-south-1.amazonaws.com/serviops-frontend:${BUILD_NUMBER}

            echo "===== Pushing Backend Image ====="

            docker push \
            373220260877.dkr.ecr.ap-south-1.amazonaws.com/serviops-backend:${BUILD_NUMBER}

            echo "===== Pushing Frontend Image ====="

            docker push \
            373220260877.dkr.ecr.ap-south-1.amazonaws.com/serviops-frontend:${BUILD_NUMBER}

            echo "===== ECR Push Completed ====="
        '''
    }
}
    }

    post {
    success {
        echo 'ServiOps CI completed successfully!'
    }

    failure {
        echo 'ServiOps CI failed!'
    }

    always {
        echo 'ServiOps pipeline execution finished.'
    }
}
}