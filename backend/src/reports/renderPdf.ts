import puppeteer from 'puppeteer';
import mustache from 'mustache';
import fs from 'fs';
import path from 'path';

export const renderPdf = async (templateName: string, data: object, reportTitle: string, projectName: string) => {
  const baseTemplatePath = path.join(__dirname, 'templates', 'base.html');
  const subTemplatePath = path.join(__dirname, 'templates', `${templateName}.html`);

  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
  const subHtml = fs.readFileSync(subTemplatePath, 'utf8');

  // Inject subTemplate content into the base template
  const combinedHtml = baseHtml.replace('{{{content}}}', subHtml);

  // Render with Mustache
  const view = {
    ...data,
    reportTitle,
    projectName,
    date: new Date().toLocaleDateString('en-GB')
  };

  const finalHtml = mustache.render(combinedHtml, view);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return pdf;
};
