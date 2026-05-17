#!/bin/bash
# =========================================
# Build script for TechnicianApp APK
# =========================================
set -e

APP_NAME="TechnicianApp"
BUILD_TYPE="${1:-debug}"   # debug | release
OUTPUT_DIR="./builds"

echo "========================================"
echo " Building $APP_NAME - $BUILD_TYPE APK"
echo "========================================"

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "Java (JDK 17) is required"; exit 1; }

# Install node modules if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

mkdir -p "$OUTPUT_DIR"

if [ "$BUILD_TYPE" = "release" ]; then
  echo "Building RELEASE APK..."

  # Verify keystore exists
  if [ ! -f "android/app/release.keystore" ]; then
    echo ""
    echo "No release.keystore found. Generating one now..."
    keytool -genkeypair \
      -v \
      -storetype PKCS12 \
      -keystore android/app/release.keystore \
      -alias cityservices-tech \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -storepass cityservices123 \
      -keypass cityservices123 \
      -dname "CN=CityServices Tech, OU=Mobile, O=CityServices EG, L=Borg El Arab, ST=Alexandria, C=EG"

    # Update gradle.properties
    sed -i "s/MYAPP_UPLOAD_STORE_PASSWORD=/MYAPP_UPLOAD_STORE_PASSWORD=cityservices123/" android/gradle.properties
    sed -i "s/MYAPP_UPLOAD_KEY_PASSWORD=/MYAPP_UPLOAD_KEY_PASSWORD=cityservices123/" android/gradle.properties
    echo "Keystore created at android/app/release.keystore"
  fi

  cd android && ./gradlew assembleRelease --no-daemon
  APK_PATH="app/build/outputs/apk/release/app-release.apk"

else
  echo "Building DEBUG APK..."
  cd android && ./gradlew assembleDebug --no-daemon
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..
cp "android/$APK_PATH" "$OUTPUT_DIR/${APP_NAME}-${BUILD_TYPE}.apk"

echo ""
echo "========================================"
echo " APK built successfully!"
echo " Location: $OUTPUT_DIR/${APP_NAME}-${BUILD_TYPE}.apk"
echo "========================================"
