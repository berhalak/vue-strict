
# vue-strict

Simple plugin for vue (and vue-cli in progress).

It lets you extract script (in ts) from a vue single-file components, to a separate file written in typescript.

Before

    // component.vue
    <template>
	  <div>{{msg}} {{user}}</div>
	</template>
	<script>
	export default {
		props : ['user'],
		data() {
			return {
				msg : 'Hello world'
			}
		}
	}
	</script>

After (in 2 files)

    // component.vue
    <template>
	  <div>{{msg}} {{user}}</div>
	</template>

	// component.vue.ts
	import { ComponentBase, prop } from 'vue-strict'
	export default class extends ComponentBase {
		@prop
		public user : string;		
		private msg : string = "Hello world";
	}


How to install

	npm i vue-strict
	
Add modify your webpack config

1. Webpack template

	module: {
		rules: [
			{
				test: /\.vue$/,
				use: [{
					loader: 'vue-loader',
					options: vueLoaderConfig
				},{
					loader : 'vue-strict'
				}]
			},

2. Vue cli based projects

(comming soon)


