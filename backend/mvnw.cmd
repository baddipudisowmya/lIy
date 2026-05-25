@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Begin all REM://maven.apache.org/wrapper/maven-wrapper
@REM Required ENV://maven.apache.org/wrapper/maven-wrapper
@REM JAVA_HOME - location of a JDK home dir

@echo off

@REM Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@REM Find the project base dir
set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

@REM Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
goto error

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe
if exist "%JAVA_EXE%" goto execute
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
goto error

:execute
@REM Setup maven-wrapper
set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

@REM Download maven-wrapper.jar if not present
if exist %WRAPPER_JAR% goto runWrapper

echo Downloading Maven Wrapper...
for /F "usebackq tokens=1,2 delims==" %%a in (%WRAPPER_PROPERTIES%) do (
    if "%%a"=="wrapperUrl" set WRAPPER_URL=%%b
)

powershell -Command "&{"^
    "param($uri,$out)"^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;"^
    "Invoke-WebRequest -Uri $uri -OutFile $out"^
    "}" -uri '%WRAPPER_URL%' -out '%WRAPPER_JAR%'"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to download maven-wrapper.jar
    echo Trying alternative download method...
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile %WRAPPER_JAR%"
)

:runWrapper
@REM Provide a "standardized" way to retrieve the CLI args that will need to be passed to the wrapper
set MAVEN_CMD_LINE_ARGS=%*

"%JAVA_EXE%" ^
  %JVM_CONFIG_MAVEN_PROPS% ^
  %MAVEN_OPTS% ^
  -jar %WRAPPER_JAR% %MAVEN_CMD_LINE_ARGS%

if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
if not "%MAVEN_TERMINATE_BATCH%" == "on" exit /B %ERROR_CODE%
