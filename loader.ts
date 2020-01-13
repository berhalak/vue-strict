let r = new RegExp("<script>.*</script>", "s");

import fs from 'fs';
import path from 'path';
import { getOptions } from 'loader-utils';
import { loader } from 'webpack';

interface View {
	name: string;
	relative: string;
	full: string;
}

function generate(folder: string, subFolder: string) {
	let components = path.join(folder, subFolder);
	let lines: View[] = [];
	if (fs.existsSync(components)) {

		for (let file of fs.readdirSync(components)) {
			if (file.endsWith(".vue")) {
				let name = path.basename(file, ".vue");
				let relative = `./${subFolder}/${file}`;
				let view: View = {
					name,
					relative,
					full: path.join(folder, relative)
				};
				lines.push(view);
			}
		}
	}
	return lines;
}

function write(view: View[]) {
	let lines: string[] = [];

	for (let v of view) {
		const relative = v.relative;
		const name = v.name;
		lines.push(`import ${name} from "${relative}";`);
		lines.push(`proper.components["${name}"] = ${name};`)
	}

	return lines.join("\r\n");
}

export function transform(
	resource: string,
	source: string,
	options: any,
	addDependency: (x: string) => void) {
	let m = source.match(r);
	let vue = resource.split("?")[0];
	if (!m) {
		let fileName = path.basename(vue, '.vue');
		let codeFullPath = path.join(path.dirname(vue), fileName + ".vue.ts");
		if (fs.existsSync(codeFullPath)) {
			addDependency(codeFullPath);
			let text = "";
			if (options.auto) {
				const components = generate(path.dirname(vue), options.auto);
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
	return source;
}

export function loader(this: loader.LoaderContext, source: string) {
	return transform(
		this.resource,
		source,
		getOptions(this),
		x => this.addDependency(x));
};