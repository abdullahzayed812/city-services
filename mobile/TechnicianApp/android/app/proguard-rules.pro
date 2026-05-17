# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }

# Keep app classes
-keep class com.customerapp.** { *; }

# Suppress warnings
-dontwarn com.facebook.**
-dontwarn okhttp3.**
-dontwarn okio.**
