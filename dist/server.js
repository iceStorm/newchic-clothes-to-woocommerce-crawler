"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function run() {
    axios_1.default.get("https://sea.newchic.com/api/v1/index/getCategoryRecommend/?pageSize=2&page=1")
        .then(function (response) {
        // console.log(response.data);
        Array.from(response.data.result.list).forEach(function (record, index, arr) {
            console.log(record);
        });
    })
        .catch(function (err) {
        console.log(err);
    });
}
// run();
function save() {
    var data = "\"car\" \"price\" \"color\"\n  \"Audi\"  10000 \"blue\"\n  \"BMW\" 15000 \"red\"\n  \"Mercedes\"  20000 \"yellow\"\n  \"Porsche\" 30000 \"green\"";
    fs_1.default.writeFile(path_1.default.resolve(__dirname, '../result/data.csv'), data, {
        encoding: 'utf8',
    }, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Saved.');
    });
}
save();
