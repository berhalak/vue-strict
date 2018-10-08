let r = new RegExp("<script>.*</script>", "s");

import fs from 'fs';
import path from 'path';

export function loader(source : string) {
    let m = source.match(r);
	let vue = this.resource.split("?")[0];
	if (!m) {		
		let fileName = path.basename(vue, '.vue');
		let codeFullPath = path.join(path.dirname(vue), fileName + ".vue.ts");
		if (fs.existsSync(codeFullPath)) {
			this.addDependency(codeFullPath);
			let scriptTag = `
<script>
import Code from './${fileName}.vue.ts';
import { bootstrap } from 'vue3';
export default bootstrap(Code);
</script>
`
			source = source + scriptTag;
		}

	}
	return source;
};