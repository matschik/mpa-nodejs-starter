import http from "http";
import nunjucks from "nunjucks";
import {
  convertFormDataToJSON,
  isDir,
  isFile,
  readBody,
  readJSON,
  writeJSON,
} from "./utils.js";
import path from "path";

nunjucks.configure({
  noCache: true,
});

function render404(response) {
  response.statusCode = 404;
  response.end("Page not found");
}

const CONTENT_DATA_PATH = "src/data/content.json";

const server = http.createServer(async (request, response) => {
  try {
    await handleServer(request, response);
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end("Internal server error");
  }
});

async function handleServer(request, response) {
  const requestURLData = new URL(request.url, "http://localhost:3000");
  console.log("New request", {
    method: request.method,
    url: request.url,
    requestURLData,
  });

  if (request.method === "GET") {
    if (path.extname(requestURLData.pathname) !== "") {
      render404(response);
      return;
    }

    let templatePath = `src/template${requestURLData.pathname}`;
    if (await isDir(templatePath)) {
      templatePath = path.join(templatePath, "index.njk");
    } else if (await isFile(`${templatePath}.njk`)) {
      templatePath = `${templatePath}.njk`;
    } else {
      render404(response);
      return;
    }

    const templateData = {
      searchParams: Object.fromEntries(requestURLData.searchParams),
      content: await readJSON(CONTENT_DATA_PATH),
    };

    const html = nunjucks.render(templatePath, templateData);
    response.end(html);
  } else if (request.method === "POST") {
    const body = await readBody(request);
    const form = convertFormDataToJSON(body);
    await writeJSON(CONTENT_DATA_PATH, form);

    response.statusCode = 302;
    response.setHeader(
      "Location",
      `${requestURLData.pathname}?submitSuccess=true`
    );
    response.end();
  } else {
    render404(response);
  }
}

server.listen(3000, () => {
  console.log("Server started on port 3000");
});
