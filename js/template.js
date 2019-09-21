if (!Object.prototype.forEach)

    Object.prototype.forEach = function (callback, scope) {

        if (typeof callback === "function") {

            var list = [];

            var that = this;

            for (var attr in that)

                if (that.hasOwnProperty(attr))

                    list.push([that[attr], attr]);

            list.forEach(function (arr) {

                callback.call(scope, arr[0], arr[1], that);
            });
        }
    };

if (!Object.prototype.instanceOf)

    Object.prototype.instanceOf = function (type) {

        type = type.prototype.toString();

        var object = this;

        while (object) {

            object = Object.getPrototypeOf(object);

            if (object && object.toString() === type)

                return true;
        }

        return false;
    };

if (!Object.prototype.empty)

    Object.defineProperty(Object.prototype, 'empty', {

        get: function () {

            if (typeof this === 'string' || this.instanceOf(String))

                return true;

            for (var attr in this)

                if (this.hasOwnProperty(attr))

                    return false;

            return true;
        },

        enumerable: false
    });

if (!String.prototype.replaceAll)

    String.prototype.replaceAll = function (oldStr, newStr) {

        if (String(newStr).indexOf(oldStr) >= 0)

            return this;

        var str = this;

        while (str.indexOf(oldStr) >= 0)

            str = str.replace(oldStr, newStr);

        return str;
    };

document.createStyleSheet = function () {

    var style = document.createElement('style');

    document.head.appendChild(style);

    var ruleList = style.sheet;

    return {

        addStyle: function (selector) {

            selector = String(selector).trim();

            selector = selector.replaceAll('  ', ' ');

            for (var i = 0; i < ruleList.rules.length; i++)

                if (ruleList.rules[i].selectorText === selector)

                    return ruleList.rules[i].style;

            ruleList.addRule(selector, '{}');

            return ruleList.rules[ruleList.rules.length - 1].style;
        }
    };
};

if (!Node.prototype.nodeTypeName)

    Object.defineProperty(Node.prototype, 'nodeTypeName', {

        get: function () {

            switch (this.nodeType) {

                case 1:
                    return 'element';
                case 2:
                    return 'attribute';
                case 3:
                    return 'textNode';
                case 9:
                    return 'document';
                default:
                    return this.nodeType;
            }
        }
    });

var s52map = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function l2s(value) {

    value = parseInt(value) || 0;

    if (value === 0)

        return 'a';

    var str = '';

    while (value > 0) {

        str = s52map[value % 52] + str;
        value = Math.floor(value / 52);
    }

    return str;
}

function initTemplate(scope, auth) {

    if (initTemplate.inited)

        return;

    Object.defineProperty(initTemplate, 'inited', {

        get: function () {

            return true;
        },

        enumerable: false,
        configurable: false,
    });

    scope = scope || {};
    auth = auth || {};

    var ID = 0,
        mode2 = false,
        beforMap = ['scope'],
        affterMap = ['list-outer', 'list', 'template-inner', 'template'],
        eventMap = [],
        localTemplate = document.createElement('div'),
        remoteTemplate = document.createElement('div'),
        isolateNodeName = ['STYLE', 'SCRIPT'],
        removeEventLock = false,
        valueListenerList = [],
        valueListenerTags = ['INPUT', 'TEXTAREA', 'SELECT'];

    var styleSheet = document.createStyleSheet();

    var style = styleSheet.addStyle('scope, [scope], [template], [list], [list-outer],' +
        ' [hide]:not([hide="false"]), [hide-length]:not([hide-length="0"])');

    style.setProperty('display', 'none', 'important');

    remoteTemplate.task = [];
    remoteTemplate.total = 0;

    function loadTemplate(attr, template) {

        // console.log(attr);

        var element = attr.ownerElement, temp, node;

        if (template.length) {

            template = template[template.length - 1].cloneNode(true);

            if (attr.name === 'template') {

                if (typeof element.dataScope === "function")

                    initPrivateValue(template, 'scope', element.dataScope(auth));

                if (typeof element.cascadeScope === "function")

                    initPrivateValue(template, 'cascadeScope', element.cascadeScope(auth));
            }

            var list = element.hasAttribute('nodes') ? element.childNodes : element.children;

            while (list.length) {

                temp = template.querySelector('slot');

                if (temp) {

                    node = list[0];

                    initPrivateValue(node, 'inited', true);

                    if (temp.hasAttribute('all'))

                        temp.parentNode.insertBefore(node, temp);

                    else

                        temp.parentNode.replaceChild(node, temp);

                } else

                    break;
            }

            temp = template.querySelector('slot');

            while (temp) {

                temp.parentNode.removeChild(temp);

                temp = template.querySelector('slot');
            }

            if (attr.name === 'template-inner') {

                while (template.childNodes.length) {

                    node = template.childNodes[0];

                    if (typeof element.dataScope === "function")

                        initPrivateValue(node, 'scope', element.dataScope(auth));

                    if (typeof element.cascadeScope === "function")

                        initPrivateValue(node, 'cascadeScope', element.cascadeScope(auth));

                    element.parentNode.insertBefore(node, element);
                }

                element.parentNode.removeChild(element);

            } else

                element.parentNode.replaceChild(template, element);

        } else

            element.parentNode.replaceChild(document.createComment(' 没有找到模板：' + attr.value + ' '), element);
    }

    function addStyle(style, id, name) {

        var styleNode = document.createElement('style');

        styleNode.innerHTML = style.innerHTML.split('}').map(function (arr) {

            arr = arr.split('{');

            arr[0] = arr[0].replaceAll('.__', '.' + name + '_' + id + '_');

            return arr.join('{');

        }).join('}');

        document.head.appendChild(styleNode);
    }

    function disposeClassName(node, id, name) {

        if (node.className) {

            node.className = node.className.split(' ').map(function (className) {

                if (className.substr(0, 2) === '__') {

                    className = className.substr(2);

                    return className + ' ' + name + '_' + id + '_' + className;

                } else

                    return className;

            }).join(' ');
        }

        return node;
    }

    var nodeNameList = {

        'META': function (node) {

            switch (node.name) {

                case 'mode2':

                    if (node.content.toLowerCase().trim() === 'true')

                        mode2 = true;

                    node.parentNode.removeChild(node);

                    break;

                case 'template':

                    var id = l2s(52 + ID ++);

                    node.parentNode.removeChild(node);

                    var iframe = document.createElement('iframe'), link;

                    if (node.hasAttribute('prefetch')) {

                        link = document.createElement('link');

                        link.rel = 'prefetch';

                        link.href = node.content;

                        document.head.appendChild(link);
                    }

                    iframe.style.display = 'none';

                    iframe.onload = function () {

                        var div = document.createElement('div');

                        div.className = node.className;

                        var temp, dom = iframe.contentDocument;

                        while (dom.querySelector('style')) {

                            temp = dom.querySelector('style');

                            addStyle(temp, id, node.className);

                            temp.parentNode.removeChild(temp);
                        }

                        Object.prototype.forEach.call(dom.body.querySelectorAll('[class*=__]'), function (n) {

                            disposeClassName(n, id, node.className);
                        });

                        while (dom.body.childNodes.length) {

                            div.appendChild(dom.body.childNodes[0]);
                        }

                        remoteTemplate.appendChild(div);

                        if (remoteTemplate.childNodes.length === remoteTemplate.total) {

                            remoteTemplate.task.forEach(function (attr) {

                                loadTemplate(attr, remoteTemplate.querySelectorAll(attr.value));
                            });

                            remoteTemplate.task = [];
                        }

                        document.head.removeChild(iframe);

                        if (link)

                            document.head.removeChild(link);
                    };

                    iframe.src = node.hasAttribute('js') ? 'cors.html#' + node.content : node.content;

                    document.head.appendChild(iframe);

                    remoteTemplate.total++;

                    break;
            }
        },

        'SCOPE': function (node) {

            if (node.parentNode === null)

                return;

            var obj = {}, tmp = null, scope = null, cascadeScope = null, nodes = [];

            node.attributes.forEach(function (attr) {

                if (attr.name[0] === '#')

                    obj[attr.name.substr(1)] = attr.value;

                else if (attr.name === 'scope')

                    scope = getScope(findScope(node), attr.value).value;
            });

            while (node.childNodes.length) {

                tmp = node.childNodes[0];

                if (typeof tmp.dataScope !== "function")

                    tmp.dataScope = function (_auth) {

                        return _auth === auth ? scope : undefined;
                    };

                if (typeof tmp.cascadeScope !== "function")

                    initCascadeScope(tmp, {});

                cascadeScope = tmp.cascadeScope(auth);

                obj.forEach(function (value, key) {

                    if (!cascadeScope.hasOwnProperty(key))

                        cascadeScope[key] = value;
                });

                node.parentNode.insertBefore(tmp, node);

                nodes.push(tmp);
            }

            node.parentNode.removeChild(node);

            nodes.forEach(function (node) {

                if (node.nodeType === 3)

                    addTextNode(node);

                else

                    addNode(node);
            });
        },

        'TEMPLATE': function (node) {

            var div = document.createElement('div');

            div.className = node.className;

            node.parentNode.removeChild(node);

            if (node.content)

                node = node.content;

            while (node.childNodes.length) {

                div.appendChild(node.childNodes[0]);
            }

            localTemplate.appendChild(div);
        },
    };

    var reserveds = {

        'scope': function (scope, attr) {

            scope = getScope(scope, attr.value);

            attr.ownerElement.dataScope = function (_auth) {

                return _auth === auth ? scope.value : undefined;
            };

            attr.ownerElement.removeAttribute('scope');
        },

        'list-outer': function (scope, attr) {

            var element = attr.ownerElement, nodes = [];

            element.querySelectorAll('[template], [template-inner]').forEach(function (template) {

                Object.prototype.forEach.call(template.childNodes, function (node) {

                    node.isolate = function (_auth) {

                        return _auth === auth ? true : undefined;
                    };
                });

                addNode(template, true);
            });

            element.isolate = function (_auth) {

                return _auth === auth ? true : undefined;
            };

            scope = getScope(scope, attr.value).value;

            scope.forEach(function (data, i) {

                if (typeof data !== "object")

                    data = {value: data};

                data._i  = typeof i === "number" ? i + 1 : i;

                if (data.value === undefined)

                    data.value = JSON.stringify(data, ' ', 2).replaceAll('{', '').replaceAll('}', '');

                var node = element.cloneNode(true);

                node.removeAttribute('list-outer');

                node.dataScope = function (_auth) {

                    return _auth === auth ? data : undefined;
                };

                element.parentNode.insertBefore(node, element);

                nodes.push(node);
            });

            element.parentNode.removeChild(element);

            nodes.forEach(addNode);
        },

        'list': function (scope, attr) {

            var element = attr.ownerElement, mirror = [];

            element.querySelectorAll('[template], [template-inner]').forEach(function (template) {

                Object.prototype.forEach.call(template.childNodes, function (node) {

                    node.isolate = function (_auth) {

                        return _auth === auth ? true : undefined;
                    };
                });

                addNode(template, true);
            });

            element.isolate = function (_auth) {

                return _auth === auth ? true : undefined;
            };

            scope = getScope(scope, attr.value).value;

            var childNodes = [];

            while (element.childNodes.length) {

                childNodes.push(element.childNodes[0]);

                element.removeChild(element.childNodes[0]);
            }

            delete element.isolate;

            element.removeAttribute('list');

            scope.forEach(eachNode.bind(null, element, childNodes, mirror, undefined));

            mirroring(element, scope, mirror, childNodes);
        },

        'template': function (scope, attr) {

            var element = attr.ownerElement;

            if (element.hasAttribute('remote')) {

                if (remoteTemplate.childNodes.length < remoteTemplate.total)

                    remoteTemplate.task.push(attr);

                else

                    loadTemplate(attr, remoteTemplate.querySelectorAll(attr.value));

            } else {

                var template = localTemplate.querySelectorAll(attr.value);

                if (template.length === 0)

                    template = remoteTemplate.querySelectorAll(attr.value);

                loadTemplate(attr, template);
            }
        }
    };

    reserveds['template-inner'] = reserveds['template'];

    function eachNode(element, childNodes, mirror, index, data, key) {

        if (typeof data !== "object")

            data = {value: data};

        data._i = typeof key === "number" ? key + 1 : key;

        if (data.value === undefined)

            data.value = JSON.stringify(data, ' ', 2).replaceAll('{', '').replaceAll('}', '');

        var list = [];

        if (index === undefined)

            index = mirror.length;

        var nodes = mirror[index];

        childNodes.forEach(function (node) {

            node = node.cloneNode(true);

            node.dataScope = function (_auth) {

                return _auth === auth ? data : undefined;
            };

            if (nodes)

                element.insertBefore(node, nodes[0]);

            else

                element.appendChild(node);

            list.push(node);
        });

        mirror.splice(index, 0, list);

        return data;
    }

    function mirroring(element, source, target, childNodes) {

        if (typeof source.push === "function")

            source.push = function (data) {

                arguments.forEach(function (data) {

                    Array.prototype.push.call(source, eachNode(element, childNodes, target, undefined, data, source.length));
                });
            };

        if (typeof source.pop === "function")

            source.pop = function () {

                var nodes = target.pop();

                if (nodes) {

                    nodes.forEach(function (node) {

                        node.parentNode.removeChild(node);
                    });

                    Array.prototype.pop.call(source);
                }
            };

        if (typeof source.shift === "function")

            source.shift = function () {

                var nodes = target.shift();

                if (nodes) {

                    nodes.forEach(function (node) {

                        node.parentNode.removeChild(node);
                    });

                    Array.prototype.shift.call(source);

                    source.forEach(function (data, i) {

                        data._i = typeof i === "number" ? i + 1 : i;
                    });
                }
            };

        if (typeof source.unshift === "function")

            source.unshift = function (data) {

                arguments.forEach(function (data) {

                    Array.prototype.unshift.call(source, eachNode(element, childNodes, target, 0, data, 0));
                });

                source.forEach(function (data, i) {

                    data._i = typeof i === "number" ? i + 1 : i;
                });
            };

        if (typeof source.splice === "function")

            source.splice = function (start, count) {

                Array.prototype.splice.apply(target, [start, count]).forEach(function (nodes) {

                    nodes.forEach(function (node) {

                        node.parentNode.removeChild(node);
                    });
                });

                Array.prototype.splice.apply(source, arguments);

                Array.prototype.slice.call(arguments, 2).forEach(function (data, i) {

                    var index = start + i;

                    eachNode(element, childNodes, target, index, data, index);
                });

                source.forEach(function (data, i) {

                    data._i = typeof i === "number" ? i + 1 : i;
                });
            };

        if (typeof source.concat === "function")

            source.concat = function () {

                arguments.forEach(function (arg) {

                    arg.forEach(source.push);
                });
            };

        source.clear = function () {

            while (source.length) {

                source.pop();
            }
        };
    }

    setInterval(function () {

        if (valueListenerList.length) {

            valueListenerList.forEach(function (node) {

                if (hasAttribute(node, 'value')) {

                    if (typeof node.oldValue === "function") {

                        if (node.oldValue(auth) !== node.value) {

                            node.oldValue(auth, node.value);

                            node.attributes['value'].value = node.value;
                        }

                    } else {

                        initPrivateValue(node, 'oldValue', node.value);

                        node.attributes['value'].value = node.value;
                    }
                }

                if (hasAttribute(node, 'checked')) {

                    if (typeof node.oldChecked === "function") {

                        if (node.oldChecked(auth) !== node.checked) {

                            node.oldChecked(auth, node.checked);

                            node.attributes['checked'].value = node.checked;
                        }

                    } else {

                        initPrivateValue(node, 'oldChecked', node.checked);

                        node.attributes['checked'].value = node.checked;
                    }
                }

                var arr = node;

                if (arr.hasOwnProperty('length') && arr['#length'] !== arr.length) {

                    arr['#length'] = arr.length;
                }
            });
        }

    }, 33);

    eventMap.push = function (event, node) {

        var ev;

        if (Object.getOwnPropertyDescriptor(event.scope, event.key).configurable === false) {

            if (event.key === 'length') {

                valueListenerList.push(event.scope);

                event.key = '#length';

                event.scope['#length'] = event.scope.length;

            } else {

                // console.warn(event.scope, event.key);
            }
        }

        for (var i = 0; i < eventMap.length; i++) {

            ev = eventMap[i];

            if (ev.scope === event.scope && ev.key === event.key) {

                if (ev.nodes.indexOf(node) < 0)

                    ev.nodes.push(node);

                return;
            }
        }

        event.nodes = [node];

        if (Object.getOwnPropertyDescriptor(event.scope, event.key).configurable) {

            Object.defineProperty(event.scope, event.key, {

                get: function () {

                    return event.value;
                },

                set: function (value) {

                    if (event.value !== String(value)) {

                        event.nodes.forEach(function (node) {

                            if (typeof node.set === "function") {

                                if (typeof node.code === "function")

                                    setTimeout(function () {

                                        var tmpScope = window.tmpScope;

                                        window.tmpScope = node.dataScope(auth);

                                        node.set(auth, eval("'" + node.code(auth) + "'"));

                                        window.tmpScope = tmpScope;

                                    }, 1);

                                else

                                    node.set(auth, value);
                            }
                        });
                    }

                    event.value = value;

                    return value;
                },
                enumerable: event.key !== '_i',
            });

            Array.prototype.push.call(eventMap, event);
        }
    };

    function removed(node) {

        if (node.nodeType === 2)

            node = node.ownerElement;

        else

            node = node.parentNode;

        while (node) {

            if (node.nodeName === 'HTML')

                return false;

            node = node.parentNode;
        }

        return true;
    }

    function removeEvent() {

        if (removeEventLock)

            return;

        removeEventLock = true;

        setTimeout(function () {

            removeEventLock = false;

        }, 1000);

        for (var i = 0; i < eventMap.length; i++) {

            for (var j = 0; j < eventMap[i].nodes.length; j++) {

                if (removed(eventMap[i].nodes[j])) {

                    eventMap[i].nodes.splice(j, 1);

                    j--;
                }
            }

            if (eventMap[i].nodes.length === 0) {

                eventMap.splice(i, 1);

                i--;
            }
        }
    }

    function hasAttribute(node, key, value) {

        if (typeof node.hasAttribute === "function") {

            if (typeof value === "undefined")

                return node.hasAttribute(key);

            else

                return node.getAttribute(key) === String(value);

        } else

            return false;
    }

    function run(f) {

        if (typeof f === "function")

            return f.apply(f, Array.prototype.slice.call(arguments, 1));
    }

    function initPrivateValue(node, key, _value) {

        if (typeof node[key] === "function")

            return;

        var value = _value;

        node[key] = function (_auth, _value) {

            if (_auth !== auth)

                return;

            if (_value !== undefined)

                value = _value;

            return value;
        }
    }

    function initCascadeScope(node, _cascade_scope) {

        if (typeof node.cascadeScope === "function")

            return;

        var cascadeScope = _cascade_scope;

        node.cascadeScope = function (_auth, _cascade_scope) {

            if (_auth !== auth)

                return;

            if (_cascade_scope !== undefined)

                cascadeScope = _cascade_scope;

            return cascadeScope;
        }
    }

    function isIsolate(element) {

        while (element) {

            if (element.nodeType === 9)

                return false;

            if (run(element.isolate, auth) || element.nodeName === 'TEMPLATE' || element.nodeName === 'SCOPE'
                || hasAttribute(element, 'isolate') && !hasAttribute(element, 'isolate', false)
                || element.nodeName !== 'HTML' && element.parentNode === null)

                return true;

            element = element.parentNode;
        }

        return false;
    }

    function isIsolateAttr(attr) {

        if (attr.ownerElement && !run(attr.isolate, auth))

            return isIsolate(attr.ownerElement);

        else

            return true;
    }

    function isIsolateNode(node) {

        if (node.parentNode && !run(node.isolate, auth))

            return isIsolate(node.parentNode);

        else

            return true;
    }

    function sortAttrList(node) {

        var list = [], i, attrList = node.attributes;

        for (i = 0; i < beforMap.length; i++)

            if (node.hasAttribute(beforMap[i]))

                list.push(attrList[beforMap[i]]);

        for (i = 0; i < attrList.length; i++)

            if (beforMap.indexOf(attrList[i].name) === -1 && affterMap.indexOf(attrList[i].name) === -1)

                list.push(attrList[i]);

        for (i = 0; i < affterMap.length; i++)

            if (node.hasAttribute(affterMap[i]))

                list.push(attrList[affterMap[i]]);

        return list;
    }

    function findScope(node) {

        while (node) {

            if (typeof node.dataScope === "function")

                return node.dataScope(auth);

            else

                node = node.parentNode;
        }

        return scope;
    }

    function getScope(scope, path) {

        var parent = scope, propKey = '';

        if (path === '' && !scope.hasOwnProperty(path))

            return {scope: parent, key: propKey, value: scope};

        path = path.split('.');

        path.forEach(function (name, i) {

            parent = scope;
            propKey = name;

            if (scope.hasOwnProperty(name))

                scope = scope[name];

            else {

                scope[name] = i === path.length - 1 ? '' : {};

                scope = scope[name];
            }
        });

        return {scope: parent, key: propKey, value: scope};
    }

    function matchBracket2(str) {

        var count = 0;

        var index = str.length;

        for (var i = 0; i < str.length; i++) {

            if (str.substr(i, 2) === '}}' && count === 0) {

                index = i;

                break;

            } else if (str[i] === '}' && count > 0)

                count--;

            else if (str[i] === '{')

                count++;
        }

        if (str.length === index)

            return [str];

        else

            return [str.substr(0, index), str.substr(index + 2)];
    }

    function transferMeaning(str, k) {

        return str.split('').map(function (s) {

            if (s === k)

                return '\\' + s;

            else

                return s;

        }).join('');
    }

    function bindStr(str1, str2) {

        str2 = str2.split('.');

        return transferMeaning(str1, "'") + "' + window.tmpScope['" + str2.join("']['") + "'] + '";
    }

    function matchBracket(str) {

        var count = 0;

        var index = str.length;

        for (var i = 0; i < str.length; i++) {

            if (str[i] === '}') {

                if (count > 0)

                    count--;

                else {

                    index = i;

                    break;
                }

            } else if (str[i] === '{')

                count++;
        }

        if (str.length === index)

            return [str];

        else

            return [str.substr(0, index), str.substr(index + 1)];
    }

    function disposeStr(str, tmpScope, casScope) {

        if (str.trim()) {

            var start = str.indexOf('{');
            var result = matchBracket(str.substr(start + 1));

            if (result.length > 1)

                str = "'" + str.substr(0, start) + "' + ("
                    + disposeStr(result[0], tmpScope, casScope) + ") + '"
                    + disposeStr(result[1], tmpScope, casScope) + "'";

            else

                str = "'" + str + "'";

            var _tmpScope = window.tmpScope;
            var _casScope = window.casScope;

            window.tmpScope = tmpScope;
            window.casScope = casScope;

            str = eval('with (window.tmpScope) { with (window.casScope) { ' + str + ' } }');

            window.tmpScope = _tmpScope;
            window.casScope = _casScope;
        }

        return str;
    }

    function cascadeScope(node) {

        var scope = {};

        if (node.ownerElement)

            node = node.ownerElement;

        while (node) {

            if (typeof node.cascadeScope === 'function')

                node.cascadeScope(auth).forEach(function (value, key) {

                    if (!scope.hasOwnProperty(key))

                        scope[key] = value;
                });

            node = node.parentNode;
        }

        return scope;
    }

    function dispose(text, scope, node) {

        // console.log('dispose', text, scope, node);

        var start = text.indexOf('{');

        if (start >= 0 && text.indexOf('}', start) > start + 1) {

            var temp, result, _scope = cascadeScope(node) || {};

            scope = scope || {};

            if (text.length > 4
                && text.substr(0, 2) + text.substr(text.length - 2) === '{{}}'
                && text.indexOf('}}') === text.length - 2) {

                result = getScope(scope, disposeStr(text.substr(2, text.length - 4), scope, _scope));

                eventMap.push(result, node);

                if (node.nodeType === 2
                    && node.name.substr(0, 2) === 'on'
                    && typeof result.value === "function") {

                    temp = node.ownerElement;
                    temp.removeAttribute(node.name);
                    temp[node.name] = result.value.bind(result.scope);

                } else if (typeof node.set === "function") {

                    node.dataScope = function (_auth) {

                        return _auth === auth ? result.scope : undefined;
                    };

                    node.key = function (_auth) {

                        return _auth === auth ? result.key : undefined;
                    };

                    node.set(auth, result.value);
                }

            } else {

                if (node.nodeType === 2 && node.name.substr(0, 2) === 'on')

                    return;

                var code = '', count = 0, index = 0, t, str, isBind = false, tmpScope, casScope;

                for (var i = 0; i < text.length; i++) {

                    if (text[i] === '{' && count === 0 && text[i - 1] !== '\\') {

                        t = text.indexOf('}}', i + 1);

                        if (text[i + 1] === '{' && t > 0) {

                            isBind = true;
                            result = matchBracket2(text.substr(i + 2));

                            if (result.length < 2)

                                str = text.substring(i + 2, t);

                            else {

                                str = result[0];

                                t = i + result[0].length + 2;
                            }

                            str = disposeStr(str, scope, _scope);

                            code += bindStr(text.substring(index, i), str);

                            eventMap.push(getScope(scope, str), node);

                            i = t + 2;

                        } else {

                            t = text.indexOf('}', i + 1);

                            if (t > 0) {

                                result = matchBracket(text.substr(i + 1));

                                if (result.length < 2)

                                    str = text.substring(i + 1, t);

                                else {

                                    str = result[0];

                                    t = i + result[0].length + 1;
                                }

                                tmpScope = window.tmpScope;

                                casScope = window.casScope;

                                window.tmpScope = scope;

                                window.casScope = _scope;

                                if (isBind)

                                    code += transferMeaning(text.substring(index, i), "'");

                                else

                                    code += text.substring(index, i);

                                try {

                                    if (isBind)

                                        code += transferMeaning(eval('with (window.tmpScope) { with (window.casScope) { '
                                            + str + ' } }'), "'") || '';

                                    else

                                        code += eval('with (window.tmpScope) { with (window.casScope) { '
                                            + str + ' } }') || '';

                                } catch (e) {

                                    console.warn(e, str);
                                }

                                window.casScope = casScope;

                                window.tmpScope = tmpScope;

                                i = t + 1;
                            }
                        }

                        index = i;
                    }
                }

                if (isBind)

                    code += transferMeaning(text.substr(index), "'");

                else

                    code += text.substr(index);

                if (typeof node.set === "function") {

                    if (isBind) {

                        code = code.split('\n').join("\\n' +\n'");

                        node.code = function (_auth) {

                            return _auth === auth ? code : undefined;
                        };

                        node.dataScope = function (_auth) {

                            return _auth === auth ? scope : undefined;
                        };

                        tmpScope = window.tmpScope;

                        window.tmpScope = scope;

                        node.set(auth, eval("'" + code + "'"));

                        window.tmpScope = tmpScope;

                    } else

                        node.set(auth, code);
                }
            }
        }
    }

    function addNode(node) {

        if (!mode2) {

            if (run(node.inited, auth))

                return;

            initPrivateValue(node, 'inited', true);
        }

        if (nodeNameList.hasOwnProperty(node.nodeName))

            return nodeNameList[node.nodeName](node);

        if (isIsolate(node))

            return;

        // console.log('addNode', node);

        if (valueListenerTags.indexOf(node.nodeName) >= 0
            && Array.prototype.indexOf.call(valueListenerList, node) < 0)

            valueListenerList.push(node);

        if (hasAttribute(node, 'isolate', false))

            node.removeAttribute('isolate');

        if (node.attributes)

            sortAttrList(node).forEach(addAttr);

        if (isIsolate(node))

            return;

        Object.prototype.forEach.call(node.childNodes, function (n) {

            if (n.nodeType === 3) {

                if (isolateNodeName.indexOf(node.nodeName) < 0)

                    addTextNode(n);

            } else {

                addNode(n);
            }
        });
    }

    function removeNode(node) {

        // console.log('removeNode', node);

        if (valueListenerTags.indexOf(node.nodeName) >= 0) {

            var i = Array.prototype.indexOf.call(valueListenerList, node);

            if (i >= 0)

                valueListenerList.splice(i, 1);
        }

        removeEvent();

        run(node.inited, auth, false);
    }

    function addTextNode(node) {

        if (isIsolateNode(node))

            return;

        // console.log('addTextNode', node);

        node.set = function (_auth, data) {

            if (_auth !== auth)

                return;

            if (node.data !== String(data) && node.parentNode !== null)

                node.data = data;
        };

        dispose(node.data, findScope(node), node);
    }

    function updateText(node) {

        // console.log('updateText', node);

        if (typeof node.key === "function" && typeof node.dataScope === "function"
            && String(node.dataScope(auth)[node.key(auth)]) !== node.data)

            node.dataScope(auth)[node.key(auth)] = node.data;

        if (!mode2 || isIsolateNode(node))

            return;

        dispose(node.data, findScope(node), node);

    }

    function removeTextNode() {

        // console.log('removeTextNode', parent, node);

        removeEvent();
    }

    function addAttr(attr) {

        var node = attr.ownerElement;

        if (attr.name === 'isolate' && attr.value === false) {

            node.removeAttribute(attr.name);

            addNode(node);

            return;
        }

        if (isIsolateAttr(attr))

            return;

        // console.log('addAttr', attr, attr.name, attr.value);

        attr.set = function (_auth, value) {

            if (_auth !== auth)

                return;

            if (attr.value !== String(value)) {

                attr.value = value;

                if (valueListenerTags.indexOf(node.nodeName) >= 0)

                    switch (attr.name) {

                        case 'value':

                            node.value = value;

                            break;

                        case 'checked':

                            if (value === 'true')

                                node.checked = true;

                            else if (value === 'false')

                                node.checked = false;

                            break;
                    }
            }
        };

        var scope = findScope(node);

        dispose(attr.value, scope, attr);

        if (attr.name.indexOf('#') === 0) {

            var key = attr.name.substr(1);

            if (typeof node.cascadeScope !== 'function')

                initCascadeScope(node, {});

            node.cascadeScope(auth)[key] = attr.value;

            node.removeAttribute(attr.name);
        }

        if (typeof reserveds[attr.name] === "function")

            reserveds[attr.name](scope, attr);

        if (node && node.nodeName === 'INPUT' && attr.name.toLowerCase() === 'checked') {

            if (attr.value === 'checked')

                setTimeout(function () {

                    node.checked = true;

                }, 1);
        }
    }

    function updateAttr(attr) {

        // console.log('updateAttr', attr, attr.value);

        var node = attr.ownerElement;

        if (typeof attr.key === "function" && typeof attr.dataScope === "function"
            && String(attr.dataScope(auth)[attr.key(auth)]) !== attr.value)

            attr.dataScope(auth)[attr.key(auth)] = attr.value;

        if (attr.name === 'isolate' && attr.value === 'false')

            addNode(node);

        if (!mode2 || isIsolateAttr(attr))

            return;

        dispose(attr.value, findScope(node), attr);
    }

    function removeAttr(node, attrName, oldValue) {

        // console.log('removeAttr', node, attrName, oldValue);

        if (attrName === 'isolate' && oldValue !== 'false')

            addNode(node);

        removeEvent();
    }

    if (typeof window.MutationObserver === "undefined")

        window.MutationObserver = function (callback) {

            var nodeList = [], loaded = false;

            function traverse(dom) {

                if (nodeList.indexOf(dom) < 0) {

                    nodeList.push(dom);

                    callback([{
                        type: 'childList', target: dom.parentNode, addedNodes: [dom], removedNodes: [],
                        oldValue: null, attributeName: null
                    }]);
                }

                dom.childNodes.forEach(function (node) {

                    traverse(node);
                });
            }

            traverse(document);

            var interval = setInterval(function () {

                traverse(document);

                if (loaded)

                    clearInterval(interval);

            }, 33);

            document.addEventListener('DOMContentLoaded', function () {

                loaded = true;
            });

            function mutation(e) {

                var m = {
                    type: this.type, target: e.relatedNode, addedNodes: [], removedNodes: [],
                    oldValue: null, attributeName: null
                };

                if (e.target.nodeType === 3) {

                    m.oldValue = e.prevValue;
                    m.target = e.target;
                }

                if (this.attr)

                    m[this.attr] = [e.target];

                if (e.attrName) {

                    m.target = e.target;
                    m.oldValue = e.prevValue;
                    m.attributeName = e.attrName;
                }

                callback([m]);
            }

            return {

                observe: function (dom, opt) {

                    // dom.addEventListener('DOMInserted', mutation.bind({name: 'DOMInserted'}));
                    // dom.addEventListener('DOMAttributeNameChanged', mutation.bind({name: 'DOMAttributeNameChanged'}));
                    // dom.addEventListener('DOMElementNameChanged', mutation.bind({name: 'DOMElementNameChanged'}));
                    // dom.addEventListener('DOMNodeRemovedFromDocument', mutation.bind({name: 'DOMNodeRemovedFromDocument'}));
                    // dom.addEventListener('DOMNodeInsertedIntoDocument', mutation.bind({name: 'DOMNodeInsertedIntoDocument'}));
                    // dom.addEventListener('DOMNodaddEventListenereRemovedFromDocument', mutation.bind({name: 'DOMNodaddEventListenereRemovedFromDocument'}));
                    // dom.addEventListener('DOMSubtreeModified', mutation.bind({type: 'childList'}));

                    if (opt.childList) {

                        dom.addEventListener('DOMNodeInserted', mutation.bind({type: 'childList', attr: 'addedNodes'}));
                        dom.addEventListener('DOMNodeRemoved', mutation.bind({
                            type: 'childList',
                            attr: 'removedNodes'
                        }));
                    }

                    if (opt.attributes)

                        dom.addEventListener('DOMAttrModified', mutation.bind({type: 'attributes'}));

                    if (opt.characterData)

                        dom.addEventListener('DOMCharacterDataModified', mutation.bind({type: 'characterData'}));
                }
            };
        };

    else

        addNode(document);

    new MutationObserver(function (mutationsList) {

        mutationsList.forEach(function (mutation) {

            var target = mutation.target;

            switch (mutation.type) {

                case 'childList':

                    mutation.removedNodes.forEach(function (node) {

                        if (node.nodeType === 3) {

                            if (target && isolateNodeName.indexOf(target.nodeName) < 0)

                                removeTextNode();

                        } else {

                            removeNode(node);
                        }
                    });

                    mutation.addedNodes.forEach(function (node) {

                        if (node.nodeType === 3) {

                            if (target && isolateNodeName.indexOf(target.nodeName) < 0)

                                addTextNode(node);

                        } else {

                            addNode(node);
                        }
                    });

                    break;

                case 'attributes':

                    var temp;

                    if (mutation.attributeName) {

                        if (!target.hasAttribute(mutation.attributeName)) {

                            removeAttr(target, mutation.attributeName, mutation.oldValue);

                        } else {

                            temp = target.attributes[mutation.attributeName];

                            if (mutation.oldValue === null)

                                addAttr(temp);

                            else if (temp.value !== mutation.oldValue)

                                updateAttr(temp);
                        }
                    }

                    break;

                case 'characterData':

                    if (mutation.oldValue !== null) {

                        if (target.parentNode && isolateNodeName.indexOf(target.parentNode.nodeName) < 0)

                            updateText(target);
                    }

                    break;

                default:

                    console.log(mutation);
            }
        });

    }).observe(document, {
        attributeOldValue: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true,
    });

    // window.map = eventMap;

    var tools = {
        set: function (key, value) {

            this[key] = value;
        },
        copy: function (newData, oldData) {

            for (var attr in newData)

                if (newData.hasOwnProperty(attr)) {

                    try {

                        if (newData[attr].empty)

                            oldData[attr] = newData[attr];

                        else

                            tools.copy(newData[attr], oldData[attr]);

                    } catch (e) {

                        console.warn(e);
                    }
                }
        }
    };

    return tools;
}
