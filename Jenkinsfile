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
    }
}