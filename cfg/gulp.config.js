module.exports = {
	paths: {
		styles: {
			watch: './src/scss/**/*.scss',
			source: './src/scss/**/*.scss',
			dest: './dist/styles',
		},
		images: {
			watch: './src/img/*.{png,gif,jpg,jpeg,svg}',
			source: './src/img/*.{png,gif,jpg,jpeg,svg}',
			dest: './dist/img',
		},
		fonts: {
			watch: './src/fonts/*',
			source: './src/fonts/*',
			dest: './dist/fonts',
		},
		scripts: {
			watch: './src/js/**/*.js',
			source: './src/js/**/*.js',
			dest: './dist/scripts',
		},
		markup: {
			watch: './src/**/*.html',
			source: './src/**/*.html',
			dest: './dist',
			
		}
	},
	browserSync: {
		server: {
			baseDir: './dist',
		}
	},
	autoprefixer: {
    	browsers: ['last 2 versions', '> 5%'],
    	cascade: false
	},
	styles: {
		outputStyle: 'compressed',
	},
	clean: {
		build: 'dist',
	}
}