/**
 * Created by zj-db0758 on 17/3/29.
 */
require('../setting');
require('../util/expand');
const Tag = require('./tag');

class TagController {
    constructor(cssInfoArr) {
        this._arr = cssInfoArr.map((item => new Tag(item))).sort((item1, item2) => {
            return item2.area - item1.area;
        });
        this.html = '';
        this.vue = '';
        this.css = '';
        this.scss = '';

        this.calcSibship();
        this.echo();
        console.log(this);
    }

    call(fnName, arg) {
        for (let item of this._arr) {
            item[fnName](arg);
        }
        return this;
    }

    calcSibship() {
        /**
         *  son && parent => lateParent => lateSon => siblings => css
         */
        // 顺序流程
        this.call('calcSonAndParent', this._arr)
            .call('sortParents')
            .call('calcLateParent')
            .call('calcLateSon')
            .call('calcSibship')
            .call('setPosition')
            .call('calcStardardSiblings')
            .call('calcYCloseSiblings')
            .call('calcCss')
            .call('setCssObj')
            .call('cleanCss')
    }

    echo() {
        const root = this._arr.max('area');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0,minimum-scale=1,maximum-scale=1">
    <meta name="format-detection" content="telephone=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="renderer" content="webkit">
    <script>
        const doc = document.documentElement;
        doc.style.fontSize = doc.clientWidth / 320 * 20 + 'px';
    </script>
    <style>
        * {
            margin: 0;
            padding: 0;
        }
        body {
            font-size: 0;
        }
    </style>
    <link rel="stylesheet" href="./css/index.css" />
    <title>Title</title>
</head>
<body>${root.echoHTML()}
</body>
</html>`;
        const echoCss = root.echoCSS();
        this.html = html;
        this.vue = `<template>${root.echoHTML(4)}
</template>

<script>
    const initArgs = window.PHPArgs;
    
    export default {
        data() {
            return {
                ...initArgs,
            };
        },
        mounted() {
            
        },
        methods: {
            
        },
    };
</script>

<style lang="scss" src="./scss/index.scss"></style>
`;
        this.css = echoCss.css.replace(/(\d+)px/g, (value, num) => {
            return parseFloat(num) / (root.width / 640 * 40) + 'rem';
        });
        this.scss = echoCss.scss;
    }
}

module.exports = TagController;
