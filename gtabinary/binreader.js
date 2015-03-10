"use strict";

function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    if (!file) return;

    var
        reader = new FileReader(),
        input = document.getElementById("drop"),
        output = document.getElementById("output");

    output.innerHTML = "Please wait...";
    reader.onloadend = function () {
        var result = reader.result;
        if (result.byteLength == 0)
            console.error('empty file');
        else {

            DataView.prototype.getStringW = function(offset, length) {
                var utf16 = new ArrayBuffer(length * 2);
                var utf16View = new Uint16Array(utf16);
                for (var i = 0; i < length * 2; i+=2) {
                    var wchar = this.getUint16(offset + i,true);
                    if (wchar == 0) break;
                    utf16View[i / 2] = wchar;
                }
                return String.fromCharCode.apply(null, utf16View);
            };
            DataView.prototype.getString = function(offset, length) {
                var chars = new ArrayBuffer(length);
                var utf8View = new Uint8Array(chars);
                for (var i = 0; i < length; i++) {
                    var char = this.getUint8(offset + i);
                    if (char == 0) break;
                    utf8View[i] = char;
                }
                return String.fromCharCode.apply(null, utf8View);
            };


            var dataView = new DataView(result);


            var
                out = '<h2>GTA III savegame content:</h2><table id="data-table"><thead><tr data-tt-id="0"><th>OFFSET</th><th>NAME</th><th>TYPE</th><th>VALUE</th></tr></thead><tbody>',

                offset = 0,

                // todo; enums helper class
                getEnum = function (e,v) {
                    return e[v] + " ("+ v +")";
                },

                // todo; extendable types, inheritance
                types = {
                    byte : {
                        getStrValue: function (v,base) {
                            var pref = {2:"0b",8:"0",16:"0x"};
                            return (pref[base]?pref[base]:"")+v.toString(base||10);
                        },
                        get value() {
                            var v = dataView.getUint8(offset, true);
                            offset += 1;
                            return v;
                        }
                    },
                    word : {
                        getStrValue: function (v,base) {
                            return types["byte"].getStrValue(v,base);
                        },
                        get value() {
                            var v = dataView.getUint16(offset, true);
                            offset += 2;
                            return v;
                        }
                    },
                    dword : {
                        getStrValue: function (v,base) {
                            return types["byte"].getStrValue(v,base);
                        },
                        get value() {
                            var v = dataView.getUint32(offset, true);
                            offset += 4;
                            return v;
                        }
                    },
                    char : {
                        getStrValue: function (v) {
                            return String.fromCharCode(v)
                        },
                        get value() {
                            return types["byte"].value;
                        }
                    },
                    wchar_t : {
                        getStrValue: function (v) {
                            return String.fromCharCode(v)
                        },
                        get value() {
                            return types["word"].value;
                        }
                    },
                    float : {
                        getStrValue: function (v,base) {
                            return v.toString();
                        },
                        get value() {
                            var v = dataView.getFloat32(offset, true).toFixed(4);
                            offset += 4;
                            return v;
                        }
                    },

                    level : {
                        getStrValue: function (v) {
                            return getEnum({1: "Portland", 2: "Staunton", 3: "Shoreside"}, v);
                        },
                        get value() {
                            return types["dword"].value;
                        }
                    }

                },

                // todo; move to types
                RwV3D = {x: "float", y: "float", z: "float"},

                // todo; move to types, allow an invokable field
                align = function (n) {
                    return function () {
                        offset += n;
                    }
                },

                // todo; separate module/file for this one
                format = [
                        {
                        "block 0" : { /* BLOCK 0: MISCELLANEOUS */
                            size                        : "dword",
                            data : {
                                szTitle                     : "wchar_t[24]",
                                systemTime : {
                                    nYear                   : "word",
                                    nMonth                  : "word",
                                    nDayOfWeek              : "word",
                                    nDay                    : "word",
                                    nHour                   : "word",
                                    nMinute                 : "word",
                                    nSecond                 : "word",
                                    nMilliseconds           : "word",
                                },
                                _unknown                    : "dword",
                                eCurrentLevel               : "level",
                                vCameraPos                  : RwV3D,
                                nMillisecondsPerGameMinute  : "dword",
                                nLastClockTick              : "dword",
                                nHours                      : "byte:4",
                                nMinutes                    : "byte:4",
                                _nCurrentPadMode            : "word:4",
                                nTimeInMilliseconds         : "dword",
                                fTimeScale                  : "float",
                                fTimerTimeStep              : "float",
                                fTimerTimeStepNonClipped    : "float",
                                nFrameCounter               : "dword",
                                _fTimeStep                  : "float",
                                _fFramesPerUpdate           : "float",
                                _fTimeScale                 : "float",
                                nOldWeatherType             : "word:4",
                                nNewWeatherType             : "word:4",
                                nForcedWeatherType          : "word:4",
                                _fWeatherInterpolationValue : "float",
                                _szCompileTime              : "char[24]",
                                _nWeatherTypeInList         : "dword",
                                _unknown1                   : "float",
                                _unknown2                   : "float",
                                size                        : "dword",
                                data : {
                                    sig         : "char[4]",
                                    size        : "dword",
                                    data : {
                                        nVariableSpaceSize  : "dword",
                                        aScriptVariable     : "dword[%nVariableSpaceSize/4]",
                                        size                : "dword",
                                        data : {
                                            nOnAMissionFlag : "dword",
                                            aContactInfo : [{
                                                nMissionFlag : "dword",
                                                nBaseBrief   : "dword",
                                            }, 16],

                                            aUnknown : [{
                                                unknown : "dword[16]",
                                            }, 4],

                                            _nLastMissionPassedTime : "dword",

                                            aBuildingSwap : [{
                                                nType               : "dword",
                                                nBuildingHandle     : "dword",
                                                nNewModel           : "dword",
                                                nOldModel           : "dword",
                                            }, 25],

                                            aInvisibilitySetting : [{
                                                nType               : "dword",
                                                nHandle             : "dword",
                                            }, 20],

                                            bAlreadyRunningAMissionScript : "byte:4",
                                            nMainScriptSize         : "dword",
                                            nLargestMissionScriptSize : "dword",
                                            nNumberOfExclusiveMissionScripts : "word:4",

                                            nNumActiveScripts : "dword",
                                            aRunningScript : [{
                                                pNext       : "dword",
                                                pPrev       : "dword",
                                                szName      : "char[8]",
                                                nCurrentIp  : "dword",
                                                nReturnStack : "dword[4]",
                                                _f24        : "dword",
                                                _f28        : "dword",
                                                nStackCounter : "word:4",
                                                nLocals     : "dword[16]",
                                                nTimerA     : "dword",
                                                nTimerB     : "dword",
                                                bIfResult   : "byte",
                                                _f79        : "byte",
                                                _f7A        : "byte:2",
                                                nWakeTime   : "dword",
                                                nIfNumber   : "word",
                                                _f82        : "byte",
                                                _f83        : "byte",
                                                _f84        : "byte",
                                                _f85        : "byte",
                                                _f86        : "byte",
                                                _f87        : "byte",
                                            }, "nNumActiveScripts"],
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        "block 1" : { /* BLOCK 1: PLAYER PEDS */
                            size                            : "dword",
                            data : {
                                size                        : "dword",
                                data : {
                                    nNumPlayers             : "dword",
                                    aPlayerPed : [{
                                        unknown1            : "dword",
                                        unknown2            : "word",
                                        unknown3            : "dword",
                                        CPed : {
                                            ped0            : "byte[52]",
                                            pos             : RwV3D,
                                            ped1            : "dword[364]"
                                        },
                                        nMaxWantedLevel     : "dword",
                                        nMaxChaosLevel      : "dword",
                                        szModelName         : "char[24]"
                                    }, "nNumPlayers"]
                                }
                            },
                        }
                    },
                    {
                        "block 2" : {
                            size                        : "dword",
                            data : {
                                size                        : "dword",
                                data : {

                                    nNumGarages              : "dword",
                                    nBombsAreFree            : "dword",
                                    nRespraysAreFree         : "dword",
                                    _nCarsCollected          : "dword",
                                    _nBankVansCollected      : "dword",
                                    _nPoliceCarsCollected    : "dword",
                                    nImportStatus            : "dword[3]",
                                    nLastTimeHelpMessage     : "dword",
                                    aSaveGarageSlot : [{
                                        aStoredCar : [{
                                            nModelId         : "dword",
                                            vPos             : RwV3D,
                                            vRotation        : RwV3D,
                                            nImmunities      : "dword",
                                            bPrimaryColor    : "byte",
                                            bSecondaryColor  : "byte",
                                            bRadioStation    : "byte",
                                            bModelVariationA : "byte",
                                            bModelVariationB : "byte",
                                            bBombType        : "byte:3",
                                        },3]
                                    },6],
                                    aGarage : [{
                                        eType    : "byte",
                                        unknown1 : "byte",
                                        unknown2 : "byte",
                                        unknown3 : "byte",
                                        unknown4 : "byte",
                                        unknown5 : "byte:3",
                                        unknown6 : "dword",
                                        unknown7 : "dword",
                                        unknown8 : "dword",
                                        unknown9 : "byte",
                                        unknown10 : "byte",
                                        unknown11 : "byte",
                                        unknown12 : "byte",
                                        unknown13 : "byte",
                                        unknown14 : "byte",
                                        unknown15 : "byte:2",
                                        fX1 : "float",
                                        fX2 : "float",
                                        fY1 : "float",
                                        fY2 : "float",
                                        fZ1 : "float",
                                        fZ2 : "float",
                                        unknown16 : "float",
                                        unknown17 : "float",
                                        unknown18 : "float",
                                        unknown19 : "float",
                                        unknown20 : "float",
                                        unknown21 : "float",
                                        unknown22 : "float",
                                        unknown23 : "float",
                                        unknown24 : "dword",
                                        unknown25 : "byte:4",
                                        unknown26 : "dword",
                                        unknown27 : "dword",
                                        unknown28 : "dword",
                                        unknown29 : "float",
                                        unknown30 : "float",
                                        unknown31 : "float",
                                        unknown32 : "float",
                                        unknown33 : "float",
                                        unknown34 : "float",
                                        unknown35 : "dword",
                                        unknown36 : "byte",
                                        unknown37 : "byte",
                                        unknown38 : "byte",
                                        unknown39 : "byte",
                                        unknown40 : "byte",
                                        unknown41 : "byte:3"
                                    },32]
                                }
                            }
                        }
                    }
                ],

                // todo; make it a class; split onto different methods
                parseBlock = function (block, context, parentLevel) {
                    var name,type,val,item,size,i,obj,itemName,level;

                    for (name in block)
                    {
                        if (block.hasOwnProperty(name)) {
                            type  = block[name];
                            level = nextLevel();

                            out += '<tr data-tt-id="'+level+'" data-tt-parent-id="'+parentLevel+'">';
                            out += '<td>' + offset + '</td>';
                            out += '<td>' + name + '</td>';

                            if (typeof type == "string")
                            {

                                var v = type.match(/%(\w+)/);

                                type = type.replace(/\%(\w+)/, function(match, p1){
                                    if (context[p1] != "undefined") {
                                        return context[p1];
                                    } else {
                                        console.error('no variable found in the current context', p1);
                                        return -1;
                                    }
                                });

                                var m = type.match(/(\w+)\[(.*)\]/);// byte[4]
                                if (m !== null) {
                                    item = m[1];
                                    size = eval(m[2]); // possible math

                                    size = (+size != size) ? context[size] : +size; // numeric string or not

                                    itemName = item;

                                    out += '<td>' + item + "[" + size + "]" + '</td>';

                                    if (itemName == "wchar_t" || itemName == "char") {
                                        var s;
                                        if (itemName == "wchar_t"){
                                            s = dataView.getStringW(offset,size);
                                            offset += size*2;
                                        }
                                        else {
                                            s = dataView.getString(offset,size);
                                            offset += size;
                                        }
                                        out += '<td>' + s + '</td>';
                                    } else {
                                        out += '<td></td>';
                                        for (i = 0; i < size; i++) {
                                            obj = {};
                                            obj[name] = item;
                                            parseBlock(obj, context, level);
                                        }
                                    }

                                } else {

                                    var m = type.match(/(\w+):(\d)+/); // byte:4
                                    if (m !== null) {

                                        type = m[1];
                                        size = +m[2];
                                        var _offset = offset;
                                        val = types[type].value;
                                        offset = _offset + size;
                                        context[name] = val;
                                        out += '<td>' + type + '</td>';
                                        out += '<td>' + types[type].getStrValue(val) + '</td>';

                                    } else {

                                        val = types[type].value;
                                        context[name] = val;
                                        out += '<td>' + type + '</td>';
                                        out += '<td>' + types[type].getStrValue(val) + '</td>';
                                    }
                                }
                            }

                            // todo; make all fields in format description as objects?
                            else if (typeof type == "object")
                            {
                                if (Array.isArray(type)){
                                    size = type[1];
                                    size = (+size != size) ? context[size] : +size; // numeric string or not

                                    out += '<td>'+name + "[" + size + "]"+'</td>'; //struct name
                                    out += '<td></td>';

                                    for (i = 0; i < size; i++) {
                                        obj = {};
                                        obj[name] = type[0];
                                        parseBlock(obj, context, level);
                                    }
                                } else {
                                    out += '<td></td>';
                                    out += '<td></td>';
                                    parseBlock(type, context, level);
                                }


                            }

                            else if (typeof type == "function") // align only?
                            {

                                out += '<td></td>';
                                out += '<td></td>';
                                type();
                            }

                            out += '</tr>';

                        }
                    }

                };

                var nextLevel = (function () {
                    var counter = 0;
                    return function () {
                        return ++counter;
                    }
                })();

                // GTA 3 save block align workaround
                // very bad design; move it to the format object
                for (var i = 0; i < format.length; i ++) {
                    var curOffset = offset;
                    var size = dataView.getUint32(offset, true);
                    parseBlock(format[i], [], 0);
                    var actualBlockSize = offset-curOffset-4;
                    if (actualBlockSize < size) offset+=size-actualBlockSize;
                }

                out += '</tbody></table>';
                output.innerHTML = out;
                // todo; allow another d&d after parsing file
                input.style.display = 'none';
                // todo; expandable table rows via format settings (huge arrays are slow)
                $("#data-table").treetable({ expandable: true, columnElType: "td,th"/*, initialState: "expanded"*/ });

        }
    }
    reader.readAsArrayBuffer(file);

}

function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
}

$(function(){
    // todo; allow loading file via open dialog
    // todo; check browser version and talk to user to update
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var dropZone = document.getElementById('drop');
        dropZone.addEventListener('dragover', handleDragOver, false);
        dropZone.addEventListener('drop', handleFileSelect, false);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
});