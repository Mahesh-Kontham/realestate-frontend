import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  try {
    // 1️⃣ Load secrets
    const serviceAccount = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT") || "{}");
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID");

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("Missing service account details");
    }
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    // 2️⃣ Create a short-lived OAuth2 access token using the service account
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    // encode header & claim
    const enc = (obj: unknown) => btoa(JSON.stringify(obj));
    const jwtUnsigned = `${enc(header)}.${enc(claim)}`;

    // sign with private key (PEM)
    const key = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(jwtUnsigned));
    const jwt = `${jwtUnsigned}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // exchange JWT for access token
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;

    // 3️⃣ Fetch rows from the first sheet
    const sheetResp = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:E20`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const sheetData = await sheetResp.json();
    console.log("Fetched Sheet Data:", sheetData);

    return new Response(JSON.stringify({ rows: sheetData.values }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
