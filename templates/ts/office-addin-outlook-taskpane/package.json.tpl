{
  "name": "{{SafeProjectNameLowerCase}}",
  "version": "0.0.1",
  "repository": {
    "type": "git",
    "url": "https://github.com/OfficeDev/Office-Addin-TaskPane.git"
  },
  "license": "MIT",
  "config": {
    "app_to_debug": "outlook",
    "app_type_to_debug": "desktop",
    "dev_server_port": 3000
  },
  "scripts": {
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development",
    "dev-server": "webpack serve --mode development",
    "lint": "office-addin-lint check",
    "lint:fix": "office-addin-lint fix",
    "prettier": "office-addin-lint prettier",
    "signin": "office-addin-dev-settings m365-account login",
    "signout": "office-addin-dev-settings m365-account logout",
    "start": "office-addin-debugging start appPackage/manifest.json",
    "stop": "office-addin-debugging stop appPackage/manifest.json",
    "validate": "office-addin-manifest validate appPackage/manifest.json",
    "watch": "webpack --mode development --watch"
  },
  "dependencies": {
    "core-js": "^3.36.0",
    "regenerator-runtime": "^0.14.1"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@babel/preset-env": "^7.25.4",
    "@babel/preset-typescript": "^7.23.3",
    "@types/office-js": "^1.0.377",
    "@types/office-runtime": "^1.0.35",
    "babel-loader": "^9.1.3",
    "copy-webpack-plugin": "^12.0.2",
    "eslint-plugin-office-addins": "^3.0.2",
    "file-loader": "^6.2.0",
    "html-loader": "^5.0.0",
    "html-webpack-plugin": "^5.6.0",
    "office-addin-cli": "^1.6.5",
    "office-addin-debugging": "^5.1.6",
    "office-addin-dev-certs": "^1.13.5",
    "office-addin-lint": "^2.3.5",
    "office-addin-manifest": "^1.13.6",
    "office-addin-prettier-config": "^1.2.1",
    "os-browserify": "^0.3.0",
    "process": "^0.11.10",
    "source-map-loader": "^5.0.0",
    "typescript": "^5.4.2",
    "webpack": "^5.95.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "5.1.0"
  },
  "prettier": "office-addin-prettier-config",
  "browserslist": [
    "last 2 versions",
    "ie 11"
  ]
}