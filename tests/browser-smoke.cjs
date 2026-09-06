// Run with Playwright available on NODE_PATH, after exporting apps/mobile.
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(".");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const file = path.resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (
    !file.startsWith(root + path.sep) ||
    !fs.existsSync(file) ||
    fs.statSync(file).isDirectory()
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    "Content-Type",
    types[path.extname(file)] || "application/octet-stream",
  );
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // Expo static export uses absolute paths for its entry bundle.
    await page.route("**/_expo/**", (route) => {
      const local = path.join(
        root,
        "apps/mobile/dist",
        new URL(route.request().url()).pathname,
      );
      return route.fulfill({ path: local, contentType: "text/javascript" });
    });
    await page.route("**/assets/**", async (route) => {
      if (!page.url().includes("/apps/mobile/dist/")) return route.continue();
      const local = path.join(
        root,
        "apps/mobile/dist",
        new URL(route.request().url()).pathname,
      );
      if (fs.existsSync(local))
        return route.fulfill({
          path: local,
          contentType: types[path.extname(local)] || "application/octet-stream",
        });
      return route.continue();
    });
    await page.goto(base + "/apps/mobile/dist/index.html");
    await page
      .getByRole("button", { name: "Empezar lección", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Mi cuenta", exact: true }).click();
    await page.getByText("Modo exploración", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await page
      .getByLabel("Correo electrónico", { exact: true })
      .fill("test@example.com");
    await page
      .getByRole("button", { name: "Crear una cuenta gratis", exact: true })
      .click();
    await page.getByText("Empieza tu historia", { exact: true }).waitFor();
    await page.getByRole("button", { name: "← Volver", exact: true }).click();
    await page
      .getByRole("button", { name: "Empezar lección", exact: true })
      .click();
    const next = () =>
      page.getByRole("button", { name: "Continuar →", exact: true }).click();
    const listen = async () => {
      await page.getByRole("button", { name: "Escuchar", exact: true }).click();
      await page
        .getByRole("button", { name: "Escuchar", exact: true })
        .waitFor({ timeout: 15000 });
    };
    for (let i = 0; i < 2; i++)
      await page
        .getByRole("button", { name: "Siguiente diálogo", exact: true })
        .click();
    await next();
    await next();
    await listen();
    await page.getByRole("button", { name: "A", exact: true }).click();
    await next();
    for (const letter of ["A", "B", "C"]) {
      await page.getByRole("button", { name: letter, exact: true }).click();
      await page
        .getByText(
          new RegExp(
            `${["A", "B", "C"].indexOf(letter) + 1} letras escuchadas`,
          ),
        )
        .waitFor();
    }
    await next();
    for (const answer of ["G", "M", "S"]) {
      await listen();
      await page.getByRole("button", { name: answer, exact: true }).click();
      await next();
    }
    for (const answer of ["CAT", "MAP", "BOOK", "WALK"]) {
      await listen();
      for (const letter of answer)
        await page
          .getByRole("button", { name: letter, exact: true })
          .first()
          .click();
      await next();
    }
    await next(); // practical information
    await page.getByRole("button", { name: "Continuar", exact: true }).click(); // optional recording
    for (let i = 0; i < 2; i++)
      await page
        .getByRole("button", { name: "Siguiente diálogo", exact: true })
        .click();
    await next();
    for (let i = 1; i <= 5; i++) {
      const option = page.getByRole("button", { name: `♪ ${i}`, exact: true });
      await option.click();
      await page
        .getByText("Toca la misma opción otra vez para elegirla.", {
          exact: true,
        })
        .waitFor();
      await option.click();
    }
    await next();
    await page.getByText("Tu recompensa: 10 XP", { exact: true }).waitFor();
    fs.mkdirSync("apps/mobile/.expo/screenshots", { recursive: true });
    await page.screenshot({
      path: "apps/mobile/.expo/screenshots/lesson-complete.png",
    });
    // Explicitly mocked backend: verifies client wiring, not live Supabase RLS.
    const config = require("../shared/backend.json");
    let cloud = null;
    let failWrites = true;
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "mobile-test@example.com",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
    const session = {
      access_token: "test-only-access-token",
      refresh_token: "test-only-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    };
    const mock = async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      let data;
      if (url.pathname === "/auth/v1/token") {
        if (req.postDataJSON().password === "incorrect-test-password") {
          return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "Invalid login credentials" }) });
        }
        data = session;
      }
      else if (url.pathname === "/auth/v1/signup") data = { user };
      else if (url.pathname === "/auth/v1/user") data = user;
      else if (url.pathname === "/auth/v1/logout") data = {};
      else if (url.pathname.endsWith("/user_progress")) {
        if (req.method() !== "GET" && failWrites) {
          return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test connection unavailable" }) });
        }
        if (req.method() !== "GET") cloud = req.postDataJSON();
        data = cloud ? [cloud] : [];
      } else if (url.pathname.endsWith("/profiles"))
        data = [
          {
            id: user.id,
            subscription_status: "active",
            current_period_end: "2099-01-01T00:00:00Z",
          },
        ];
      else data = [];
      if (req.headers().accept?.includes("vnd.pgrst.object"))
        data = Array.isArray(data) ? data[0] : data;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data ?? null),
      });
    };
    await page.context().route(config.url + "/**", mock);
    await page
      .getByRole("button", { name: "Iniciar sesión para guardar", exact: true })
      .click();
    await page
      .getByLabel("Correo electrónico", { exact: true })
      .fill(user.email);
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill("incorrect-test-password");
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    await page.getByText("Invalid login credentials", { exact: true }).waitFor();
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill("test-only-password");
    await page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Guardar progreso", exact: true })
      .click();
    await page.getByText("Test connection unavailable", { exact: true }).waitFor();
    assert.equal(cloud, null);
    assert.ok(await page.evaluate(id => localStorage.getItem(`expresate:pending:${id}`), user.id));
    failWrites = false;
    await page.getByRole("button", { name: "Guardar progreso", exact: true }).click();
    await page
      .getByText("Lección completada · 10 XP", { exact: true })
      .waitFor();
    assert.equal(cloud.progress.lessons["lesson-000-alphabet"].xpReward, 10);
    await page.reload();
    await page
      .getByRole("button", { name: "Practicar de nuevo", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Mi cuenta", exact: true }).click();
    await page.getByText("Exprésate Premium", { exact: true }).waitFor();
    // Load the actual web bridge against the same mocked account record.
    const cross = await page.context().newPage();
    await cross.goto(base + "/curso.html");
    await cross.waitForFunction(() =>
      window.Progress?.isLessonDone("lesson-000-alphabet"),
    );
    assert.equal(await cross.evaluate(() => window.Progress.getXP()), 10);
    // Reverse direction: complete another lesson through the actual web API.
    await cross.evaluate(() =>
      window.Progress.setLessonDone("lesson-001-sounds", true),
    );
    await cross.waitForTimeout(2400);
    assert.equal(cloud.progress.lessons["lesson-001-sounds"].done, true);
    await cross.close();
    await page
      .getByRole("button", { name: "Actualizar desde la cuenta", exact: true })
      .click();
    await page.getByText("20", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .click();
    await page
      .getByText(
        "Explora la primera clase. Inicia sesión para guardar tu progreso.",
        { exact: true },
      )
      .waitFor();
    await page.getByRole("button", { name: "Iniciar sesión / Crear cuenta", exact: true }).click();
    await page.getByRole("button", { name: "Crear una cuenta gratis", exact: true }).click();
    await page.getByLabel("Correo electrónico", { exact: true }).fill("new-test@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("test-only-password");
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await page.getByText("Revisa tu correo y confirma tu cuenta. Después vuelve aquí e inicia sesión.", { exact: true }).waitFor();
    console.log(
      "PASS MOCKED account: invalid login, signup confirmation, login, failed-write queue/retry, persisted session reload, Premium read, bidirectional web/mobile progress, logout",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Expo web preview: navigation, auth form, all Lesson 000 interactions and recorded audio, guest completion",
    );
    await page.close();
    const web = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const webErrors = [];
    web.on("pageerror", (e) => webErrors.push(e.message));
    for (const route of [
      "/index.html",
      "/curso.html",
      "/lesson-000-alphabet.html",
      "/lesson-001-sounds.html",
      "/auth.html",
    ]) {
      await web.goto(base + route);
      await web.waitForFunction(() => !!window.Progress);
      assert.equal(
        await web.evaluate(() => typeof window.ExpresateProgressCore.sync),
        "function",
      );
    }
    assert.deepEqual(webErrors, []);
    console.log(
      "PASS existing web: five key routes and shared dependency initialization, no page errors",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
