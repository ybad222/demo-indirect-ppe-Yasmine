pipeline {
  agent any
  tools {nodejs "NodeJS 22"}
    stages {
      stage('Version') {
       steps {
        script {
	          sh '''npm version
	          '''
       }
      }
     }
     stage('Build') {
       steps {
        script {
	      withCredentials([usernamePassword(credentialsId: 'GIT_CREDS', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
	          sh '''./install.sh
	          '''
	      }
        }
      }
    }
    stage('Publish') {
       steps {
        script {
	          //sh '''npm publish
	          //'''
       }
      }    
    }
  }
}
