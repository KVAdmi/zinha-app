package com.zinha.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> {
          String origin = request.getOrigin().toString();
          if (origin.endsWith("meet.zinha.app/") || origin.contains("meet.zinha.app")) {
            request.grant(request.getResources()); // cámara/mic para Jitsi
          } else {
            request.deny();
          }
        });
      }
    });
  }
}
