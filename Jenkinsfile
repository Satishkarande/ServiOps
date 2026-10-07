pipeline {
    agent any

    stages {

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