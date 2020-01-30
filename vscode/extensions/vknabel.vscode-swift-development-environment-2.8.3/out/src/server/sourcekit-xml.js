"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convert = require("xml-js");
function parseDocumentation(xml) {
    if (xml == null)
        return [];
    const root = convert.xml2js(xml, {
        captureSpacesBetweenElements: true
    });
    return root.elements.map(e => e.elements
        .filter(e => e.name === SkElementType.CommentParts)
        .map(sk2md)
        .join(""));
}
exports.parseDocumentation = parseDocumentation;
var SkElementType;
(function (SkElementType) {
    SkElementType["cdata"] = "cdata";
    SkElementType["text"] = "text";
    SkElementType["element"] = "element";
    SkElementType["Name"] = "Name";
    SkElementType["Declaration"] = "Declaration";
    SkElementType["USR"] = "USR";
    SkElementType["CommentParts"] = "CommentParts";
    SkElementType["Parameters"] = "Parameters";
    SkElementType["Parameter"] = "Parameter";
    SkElementType["Direction"] = "Direction";
    SkElementType["Abstract"] = "Abstract";
    SkElementType["Discussion"] = "Discussion";
    SkElementType["Item"] = "Item";
    SkElementType["ResultDiscussion"] = "ResultDiscussion";
    SkElementType["ThrowsDiscussion"] = "ThrowsDiscussion";
    SkElementType["CodeListing"] = "CodeListing";
    SkElementType["zCodeLineNumbered"] = "zCodeLineNumbered";
    SkElementType["ListBullet"] = "List-Bullet";
    SkElementType["ListNumber"] = "List-Number";
    SkElementType["Para"] = "Para";
    SkElementType["codeVoice"] = "codeVoice";
})(SkElementType || (SkElementType = {}));
function sk2md(element) {
    switch (element.type) {
        case SkElementType.cdata:
            return element.cdata;
        case SkElementType.text:
            return element.text;
        case "element":
            return skElement2md(element);
    }
}
function skElement2md(element) {
    const children = (opt = {}, els) => (els || element.elements || [])
        .map(sk2md)
        .map(opt.map || ((id) => id))
        .join(opt.sep || "");
    switch (element.name) {
        case SkElementType.Abstract:
        case SkElementType.CommentParts:
            return children();
        case SkElementType.Discussion:
            return "\n\n**Discussion:**\n\n" + children() + "\n\n";
        case SkElementType.ThrowsDiscussion:
            return "\n\n**Throws:**" + children() + "\n\n";
        case SkElementType.ResultDiscussion:
            return "\n\n**Returns:**" + children() + "\n\n";
        case SkElementType.CodeListing:
            return ("\n```" +
                (element.attributes.language || "") +
                "\n" +
                children({ sep: "\n" }) +
                "\n```\n");
        case SkElementType.codeVoice:
            return "`" + children() + "`";
        case SkElementType.Declaration:
            return children();
        case SkElementType.Item:
            return children();
        case SkElementType.ListBullet:
            return "\n" + children({ sep: "\n", map: c => "* " + c }) + "\n";
        case SkElementType.ListNumber:
            return ("\n" + children({ sep: "\n", map: (c, i) => i + 1 + ". " + c }) + "\n");
        case SkElementType.Name:
            return "**" + children() + "**";
        case SkElementType.Para:
            return "\n" + children() + "\n";
        case SkElementType.Parameter:
            const name = children({}, [].concat(...element.elements
                .filter(e => e.name === SkElementType.Name)
                .map(e => e.elements)));
            const discussion = children({}, [].concat(...element.elements
                .filter(e => e.name === SkElementType.Discussion)
                .map(e => e.elements)));
            return discussion.length > 0
                ? `**${name}:** ${discussion}`
                : `**${name}**`;
        case SkElementType.Parameters:
            return ("\n\n**Parameters:**" + children({ map: c => "\n* " + c }) + "\n\n");
        case SkElementType.zCodeLineNumbered:
            return children();
        case SkElementType.Direction: // unknown
            return "";
        default:
            return ("**<" +
                element.name +
                ">** " +
                children() +
                "**<" +
                element.name +
                ">** ");
    }
}
//# sourceMappingURL=sourcekit-xml.js.map