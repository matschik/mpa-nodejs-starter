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
import { readFile } from "fs/promises";

nunjucks.configure({
  noCache: true,
});

const CONTENT_DATA_PATH = "src/data/content.json";
const PORT = 3000;

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
  const requestURLData = new URL(request.url, `http://localhost:${PORT}`);
  console.info(`\n---\nRequest ${new Date().getTime()}`, {
    method: request.method,
    url: request.url,
    requestURLData,
  });

  if (request.method === "GET") {
    if (path.extname(requestURLData.pathname) !== "") {
      const assetsFilePath = `src/assets${requestURLData.pathname}`;
      console.log({ assetsFilePath });
      await renderFilePath(response, assetsFilePath);
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

server.listen(PORT, () => {
  console.info(`Server started on port ${PORT}`);
});

async function renderFilePath(response, filePath) {
  if (await isFile(filePath)) {
    const fileContent = await readFile(filePath);
    response.end(fileContent);
  } else {
    render404(response);
  }
}

function render404(response) {
  response.statusCode = 404;
  response.end("Page not found");
}
