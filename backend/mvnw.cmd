@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-22"
set "PATH=%~dp0apache-maven-3.9.6\bin;%JAVA_HOME%\bin;%PATH%"
"%~dp0apache-maven-3.9.6\bin\mvn.cmd" %*
