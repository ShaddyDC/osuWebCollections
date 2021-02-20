module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        'airbnb-typescript/base',
        'prettier',
        'prettier/@typescript-eslint',
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2019,
        "project": "./tsconfig.json",
        "sourceType": "module",
        "tsconfigRootDir": __dirname
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "max-classes-per-file": 0,
        "no-console": 0
    },
    "root": true
};
