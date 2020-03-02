let r = new RegExp("<script>.*</script>", "s");

import fs from 'fs';
import path from 'path';
import { getOptions } from 'loader-utils';

interface View {
	name: string;
	relative: string;
	full: string;
}


function generate(folder: string, fileFolder: string, viewsFolder: string, pageFolder: string, flat: boolean) {
	let viewsFolderPath = path.join(folder, viewsFolder);
	let lines: View[] = [];
	if (fs.existsSync(viewsFolderPath)) {
		for (let file of fs.readdirSync(viewsFolderPath)) {
			if (file.endsWith(".vue")) {
				let name = path.basename(file, ".vue");
				let fullViewPath = path.join(folder, viewsFolder, file);
				let relative = path.relative(fileFolder, fullViewPath).split("\\").join("/");
				if (!relative.startsWith(".")) {
					relative = "./" + relative;
				}
				let view: View = {
					name,
					relative,
					full: relative
				};
				lines.push(view);
			}
		}
	}

	// end on pages
	if (folder.endsWith(pageFolder) || flat) {
		return lines;
	}

	// safe net, don't go outside package.json
	let parent = path.resolve(path.join(folder, ".."));
	if (fs.existsSync(path.join(parent, "package.json"))) {
		return lines;
	}

	let fromParent = generate(parent, fileFolder, viewsFolder, pageFolder, flat);

	lines = [...lines, ...fromParent];

	return lines;
}

function write(view: View[]) {
	let lines: string[] = [];
	let imports: string[] = [];

	let hash: any = {};

	for (let v of view) {
		const relative = v.relative;
		const name = v.name;
		if (name in hash) continue;
		hash[name] = name;

		imports.push(`import ${name} from "${relative}";`);
		lines.push(`proper.components["${name}"] = ${name};`)
	}

	return [...imports, ...lines].join("\r\n");
}

export function transform(
	resource: string,
	source: string,
	options: any,
	addDependency: (x: string) => void) {
	let vue = resource.split("?")[0];
	if (vue.includes("node_modules")) {
		return source;
	}
	let m = source.match(r);
	if (!m) {
		let fileName = path.basename(vue, '.vue');
		let codeFullPath = path.join(path.dirname(vue), fileName + ".vue.ts");

		if (fs.existsSync(codeFullPath)) {
			addDependency(codeFullPath);
			let text = "";
			if (options.auto) {
				const components = generate(path.dirname(vue), path.dirname(vue), options.auto, options.pages || "pages", options.flat);
				text = write(components);
				components.forEach(x => addDependency(x.full));
			}
			let scriptTag = `
<script>
import Code from './${fileName}.vue.ts';
import { bootstrap } from 'vue-strict';
let proper = bootstrap(Code);
proper.components = proper.components || {};
${text}
export default proper;
</script>
`
			source = source + scriptTag;
		}

	}
	if (options.log) {
		console.log("// " + resource);
		console.log(source);
	}
	return source;
}

export function loader(source: string) {
	return transform(
		this.resource,
		source,
		getOptions(this) || {},
		x => this.addDependency(x));
};