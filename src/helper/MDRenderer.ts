import dompurify from 'dompurify';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';
import { parse, Renderer } from 'marked';

const plainRenderer = new (class extends Renderer {
	code() {
		return '';
	}

	blockquote(quote: string) {
		return `${quote}\n`;
	}

	html() {
		return '';
	}

	heading() {
		return '';
	}

	hr() {
		return '';
	}

	list(body: string) {
		return `${body}\n`;
	}

	listitem(text: string) {
		return `${text}\n`;
	}

	checkbox() {
		return '';
	}

	paragraph(text: string) {
		return `${text}\n`;
	}

	table() {
		return '';
	}

	tablerow() {
		return '';
	}

	tablecell() {
		return '';
	}

	strong(text: string) {
		return text;
	}

	em(text: string) {
		return text;
	}

	codespan(text: string) {
		return text;
	}

	br() {
		return ' ';
	}

	del(text: string) {
		return text;
	}

	link(href: string | null, title: string | null, text: string) {
		return text;
	}

	image() {
		return '';
	}

	text(text: string) {
		return text;
	}
})();
const textRenderer = new (class extends Renderer {
	code() {
		return '';
	}

	blockquote(quote: string) {
		return `${quote}\n`;
	}

	html() {
		return '';
	}

	heading(text: string) {
		return `${text}\n`;
	}

	hr() {
		return '';
	}

	list(body: string) {
		return `${body}\n`;
	}

	listitem(text: string) {
		return `${text}\n`;
	}

	checkbox() {
		return '';
	}

	paragraph(text: string) {
		return `${text}\n`;
	}

	table() {
		return '';
	}

	tablerow() {
		return '';
	}

	tablecell() {
		return '';
	}

	strong(text: string) {
		return text;
	}

	em(text: string) {
		return text;
	}

	codespan(text: string) {
		return text;
	}

	br() {
		return '';
	}

	del(text: string) {
		return text;
	}

	link(href: string | null, title: string | null, text: string) {
		return `${href} ${title} ${text} `;
	}

	image() {
		return '';
	}

	text(text: string) {
		return text;
	}
})();

export async function parseAsHTMLWithImageAndVideo(
	content: string,
	postImage: { [key: number]: string },
	postVideo: { [key: number]: string }
): Promise<string> {
	const htmlRenderer = new (class extends Renderer {
		image(href: string | null, title: string | null, text: string) {
			if (href) {
				const match = href.match(/[\$@](\d+)$/i);

				if (match) {
					if (match[0][0] === '$') {
						// Image
						const index = parseInt(match[1]);

						if (!isNaN(index) && index in postImage)
							href = postImage[index];
					} else if (match[0][0] === '@') {
						// Video
						const index = parseInt(match[1]);

						if (!isNaN(index) && index in postVideo)
							return super
								.image(postVideo[index], title, text)
								.replace(/^<img/i, '<video controls');
					}
				}
			}

			return super.image(href, title, text);
		}
	})();

	return new Promise<string>((resolve, reject) =>
		parse(
			content,
			{
				renderer: htmlRenderer,
				highlight: (code, lang) =>
					hljs.highlight(
						hljs.getLanguage(lang) ? lang : 'plaintext',
						code
					).value,
			},
			(err, result) =>
				err
					? reject(err)
					: resolve(
							dompurify(
								(new JSDOM().window as unknown) as Window
							).sanitize(result.trim())
					  )
		)
	);
}

export async function parseAsPlain(content: string): Promise<string> {
	return new Promise<string>((resolve, reject) =>
		parse(content, { renderer: plainRenderer }, (err, result) =>
			err ? reject(err) : resolve(result.trim().replace(/\s+/g, ' '))
		)
	);
}

export async function parseAsText(content: string): Promise<string> {
	return new Promise<string>((resolve, reject) =>
		parse(content, { renderer: textRenderer }, (err, result) =>
			err ? reject(err) : resolve(result.trim().replace(/\s+/g, ' '))
		)
	);
}
