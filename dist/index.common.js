"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginExportXLSX = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils"));

var ExcelJS = _interopRequireWildcard(require("exceljs"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var defaultHeaderBackgroundColor = 'f8f8f9';
var defaultCellFontColor = '606266';
var defaultCellBorderStyle = 'thin';
var defaultCellBorderColor = 'e8eaec';

function getCellLabel(column, cellValue) {
  if (cellValue) {
    switch (column.cellType) {
      case 'string':
        return _xeUtils["default"].toValueString(cellValue);

      case 'number':
        if (!isNaN(cellValue)) {
          return Number(cellValue);
        }

        break;

      default:
        if (cellValue.length < 12 && !isNaN(cellValue)) {
          return Number(cellValue);
        }

        break;
    }
  }

  return cellValue;
}

function getFooterData(opts, footerData) {
  var footerFilterMethod = opts.footerFilterMethod;
  return footerFilterMethod ? footerData.filter(function (items, index) {
    return footerFilterMethod({
      items: items,
      $rowIndex: index
    });
  }) : footerData;
}

function getFooterCellValue($table, opts, rows, column) {
  var cellValue = getCellLabel(column, rows[$table.getVMColumnIndex(column)]);
  return cellValue;
}

function getValidColumn(column) {
  var childNodes = column.childNodes;
  var isColGroup = childNodes && childNodes.length;

  if (isColGroup) {
    return getValidColumn(childNodes[0]);
  }

  return column;
}

function setExcelRowHeight(excelRow, height) {
  if (height) {
    excelRow.height = _xeUtils["default"].floor(height * 0.75, 12);
  }
}

function setExcelCellStyle(excelCell, align) {
  excelCell.protection = {
    locked: false
  };
  excelCell.alignment = {
    vertical: 'middle',
    horizontal: align || 'left'
  };
  excelCell.font = {
    name: 'Arial',
    size: 8
  };
}

function getDefaultBorderStyle() {
  return {
    top: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    left: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    bottom: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    right: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    }
  };
}

function exportXLSX(params) {
  var msgKey = 'xlsx';
  var $table = params.$table,
      options = params.options,
      columns = params.columns,
      colgroups = params.colgroups,
      datas = params.datas;
  var $vxe = $table.$vxe,
      rowHeight = $table.rowHeight,
      allHeaderAlign = $table.headerAlign,
      allAlign = $table.align,
      allFooterAlign = $table.footerAlign;
  var modal = $vxe.modal,
      t = $vxe.t;
  var message = options.message,
      sheetName = options.sheetName,
      isHeader = options.isHeader,
      isFooter = options.isFooter,
      isMerge = options.isMerge,
      isColgroup = options.isColgroup,
      original = options.original,
      useStyle = options.useStyle,
      sheetMethod = options.sheetMethod;
  var showMsg = message !== false;
  var mergeCells = $table.getMergeCells();
  var colList = [];
  var footList = [];
  var sheetCols = [];
  var sheetMerges = [];
  var beforeRowCount = 0;
  var colHead = {};
  columns.forEach(function (column) {
    var id = column.id,
        property = column.property,
        renderWidth = column.renderWidth;
    colHead[id] = original ? property : column.getTitle();
    sheetCols.push({
      key: id,
      width: _xeUtils["default"].ceil(renderWidth / 8, 1)
    });
  }); // 处理表头

  if (isHeader) {
    // 处理分组
    if (isColgroup && !original && colgroups) {
      colgroups.forEach(function (cols, rIndex) {
        var groupHead = {};
        columns.forEach(function (column) {
          groupHead[column.id] = null;
        });
        cols.forEach(function (column) {
          var _colSpan = column._colSpan,
              _rowSpan = column._rowSpan;
          var validColumn = getValidColumn(column);
          var columnIndex = columns.indexOf(validColumn);
          groupHead[validColumn.id] = original ? validColumn.property : column.getTitle();

          if (_colSpan > 1 || _rowSpan > 1) {
            sheetMerges.push({
              s: {
                r: rIndex,
                c: columnIndex
              },
              e: {
                r: rIndex + _rowSpan - 1,
                c: columnIndex + _colSpan - 1
              }
            });
          }
        });
        colList.push(groupHead);
      });
    } else {
      colList.push(colHead);
    }

    beforeRowCount += colList.length;
  } // 处理合并


  if (isMerge && !original) {
    mergeCells.forEach(function (mergeItem) {
      var mergeRowIndex = mergeItem.row,
          mergeRowspan = mergeItem.rowspan,
          mergeColIndex = mergeItem.col,
          mergeColspan = mergeItem.colspan;
      sheetMerges.push({
        s: {
          r: mergeRowIndex + beforeRowCount,
          c: mergeColIndex
        },
        e: {
          r: mergeRowIndex + beforeRowCount + mergeRowspan - 1,
          c: mergeColIndex + mergeColspan - 1
        }
      });
    });
  }

  var rowList = datas.map(function (item) {
    var rest = {};
    columns.forEach(function (column) {
      rest[column.id] = getCellLabel(column, item[column.id]);
    });
    return rest;
  });
  beforeRowCount += rowList.length; // 处理表尾

  if (isFooter) {
    var _$table$getTableData = $table.getTableData(),
        footerData = _$table$getTableData.footerData;

    var footers = getFooterData(options, footerData);
    var mergeFooterItems = $table.getMergeFooterItems(); // 处理合并

    if (isMerge && !original) {
      mergeFooterItems.forEach(function (mergeItem) {
        var mergeRowIndex = mergeItem.row,
            mergeRowspan = mergeItem.rowspan,
            mergeColIndex = mergeItem.col,
            mergeColspan = mergeItem.colspan;
        sheetMerges.push({
          s: {
            r: mergeRowIndex + beforeRowCount,
            c: mergeColIndex
          },
          e: {
            r: mergeRowIndex + beforeRowCount + mergeRowspan - 1,
            c: mergeColIndex + mergeColspan - 1
          }
        });
      });
    }

    footers.forEach(function (rows) {
      var item = {};
      columns.forEach(function (column) {
        item[column.id] = getFooterCellValue($table, options, rows, column);
      });
      footList.push(item);
    });
  }

  var exportMethod = function exportMethod() {
    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet(sheetName);
    workbook.creator = 'vxe-table';
    sheet.columns = sheetCols;

    if (isHeader) {
      sheet.addRows(colList).forEach(function (excelRow) {
        if (useStyle) {
          setExcelRowHeight(excelRow, rowHeight);
        }

        excelRow.eachCell(function (excelCell) {
          var excelCol = sheet.getColumn(excelCell.col);
          var column = $table.getColumnById(excelCol.key);
          var headerAlign = column.headerAlign,
              align = column.align;
          setExcelCellStyle(excelCell, headerAlign || align || allHeaderAlign || allAlign);

          if (useStyle) {
            Object.assign(excelCell, {
              font: {
                name: 'Arial',
                bold: false,
                color: {
                  argb: defaultCellFontColor
                },
                size: 8
              },
              fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                  argb: defaultHeaderBackgroundColor
                }
              },
              border: getDefaultBorderStyle()
            });
          } else {
            Object.assign(excelCell, {
              font: {
                name: 'Arial',
                bold: false,
                size: 8
              }
            });
          }
        });
      });
    }

    sheet.addRows(rowList).forEach(function (excelRow) {
      if (useStyle) {
        setExcelRowHeight(excelRow, rowHeight);
      }

      excelRow.eachCell(function (excelCell) {
        var excelCol = sheet.getColumn(excelCell.col);
        var column = $table.getColumnById(excelCol.key);
        var align = column.align;
        setExcelCellStyle(excelCell, align || allAlign);

        if (useStyle) {
          Object.assign(excelCell, {
            font: {
              name: 'Arial',
              size: 8,
              color: {
                argb: defaultCellFontColor
              }
            },
            border: getDefaultBorderStyle()
          });
        } else {
          Object.assign(excelCell, {
            font: {
              name: 'Arial',
              bold: false,
              size: 8
            }
          });
        }
      });
    });

    if (isFooter) {
      sheet.addRows(footList).forEach(function (excelRow) {
        if (useStyle) {
          setExcelRowHeight(excelRow, rowHeight);
        }

        excelRow.eachCell(function (excelCell) {
          var excelCol = sheet.getColumn(excelCell.col);
          var column = $table.getColumnById(excelCol.key);
          var footerAlign = column.footerAlign,
              align = column.align;
          setExcelCellStyle(excelCell, footerAlign || align || allFooterAlign || allAlign);

          if (useStyle) {
            Object.assign(excelCell, {
              font: {
                name: 'Arial',
                size: 8,
                color: {
                  argb: defaultCellFontColor
                }
              },
              border: getDefaultBorderStyle()
            });
          } else {
            Object.assign(excelCell, {
              font: {
                name: 'Arial',
                bold: false,
                size: 8
              }
            });
          }
        });
      });
    }

    if (useStyle && sheetMethod) {
      var sParams = {
        options: options,
        workbook: workbook,
        worksheet: sheet,
        columns: columns,
        colgroups: colgroups,
        datas: datas,
        $table: $table
      };
      sheetMethod(sParams);
    }

    sheetMerges.forEach(function (_ref) {
      var s = _ref.s,
          e = _ref.e;
      sheet.mergeCells(s.r + 1, s.c + 1, e.r + 1, e.c + 1);
    });
    workbook.xlsx.writeBuffer().then(function (buffer) {
      var blob = new Blob([buffer], {
        type: 'application/octet-stream'
      }); // 导出 xlsx

      downloadFile(params, blob, options);

      if (showMsg && modal) {
        modal.close(msgKey);
        modal.message({
          content: t('vxe.table.expSuccess'),
          status: 'success'
        });
      }
    });
  };

  if (showMsg && modal) {
    modal.message({
      id: msgKey,
      content: t('vxe.table.expLoading'),
      status: 'loading',
      duration: -1
    });
    setTimeout(exportMethod, 1500);
  } else {
    exportMethod();
  }
}

function downloadFile(params, blob, options) {
  var $table = params.$table;
  var $vxe = $table.$vxe;
  var modal = $vxe.modal,
      t = $vxe.t;
  var message = options.message,
      filename = options.filename,
      type = options.type;
  var showMsg = message !== false;

  if (window.Blob) {
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, "".concat(filename, ".").concat(type));
    } else {
      var linkElem = document.createElement('a');
      linkElem.target = '_blank';
      linkElem.download = "".concat(filename, ".").concat(type);
      linkElem.href = URL.createObjectURL(blob);
      document.body.appendChild(linkElem);
      linkElem.click();
      document.body.removeChild(linkElem);
    }
  } else {
    if (showMsg && modal) {
      modal.alert({
        content: t('vxe.error.notExp'),
        status: 'error'
      });
    }
  }
}

function checkImportData(tableFields, fields) {
  return fields.some(function (field) {
    return tableFields.indexOf(field) > -1;
  });
}

function importError(params) {
  var $table = params.$table,
      options = params.options;
  var $vxe = $table.$vxe,
      _importReject = $table._importReject;
  var showMsg = options.message !== false;
  var modal = $vxe.modal,
      t = $vxe.t;

  if (showMsg && modal) {
    modal.message({
      content: t('vxe.error.impFields'),
      status: 'error'
    });
  }

  if (_importReject) {
    _importReject({
      status: false
    });
  }
}

function importXLSX(params) {
  var $table = params.$table,
      columns = params.columns,
      options = params.options,
      file = params.file;
  var $vxe = $table.$vxe,
      _importResolve = $table._importResolve;
  var modal = $vxe.modal,
      t = $vxe.t;
  var showMsg = options.message !== false;
  var fileReader = new FileReader();

  fileReader.onerror = function () {
    importError(params);
  };

  fileReader.onload = function (evnt) {
    var tableFields = [];
    columns.forEach(function (column) {
      var field = column.property;

      if (field) {
        tableFields.push(field);
      }
    });
    var workbook = new ExcelJS.Workbook();
    var readerTarget = evnt.target;

    if (readerTarget) {
      workbook.xlsx.load(readerTarget.result).then(function (wb) {
        var firstSheet = wb.worksheets[0];

        if (firstSheet) {
          var sheetValues = firstSheet.getSheetValues();

          var fieldIndex = _xeUtils["default"].findIndexOf(sheetValues, function (list) {
            return list && list.length > 0;
          });

          var fields = sheetValues[fieldIndex];
          var status = checkImportData(tableFields, fields);

          if (status) {
            var records = sheetValues.slice(fieldIndex).map(function (list) {
              var item = {};
              list.forEach(function (cellValue, cIndex) {
                item[fields[cIndex]] = cellValue;
              });
              var record = {};
              tableFields.forEach(function (field) {
                record[field] = _xeUtils["default"].isUndefined(item[field]) ? null : item[field];
              });
              return record;
            });
            $table.createData(records).then(function (data) {
              var loadRest;

              if (options.mode === 'insert') {
                loadRest = $table.insertAt(data, -1);
              } else {
                loadRest = $table.reloadData(data);
              }

              return loadRest.then(function () {
                if (_importResolve) {
                  _importResolve({
                    status: true
                  });
                }
              });
            });

            if (showMsg && modal) {
              modal.message({
                content: t('vxe.table.impSuccess', [records.length]),
                status: 'success'
              });
            }
          } else {
            importError(params);
          }
        } else {
          importError(params);
        }
      });
    } else {
      importError(params);
    }
  };

  fileReader.readAsArrayBuffer(file);
}

function handleImportEvent(params) {
  if (params.options.type === 'xlsx') {
    importXLSX(params);
    return false;
  }
}

function handleExportEvent(params) {
  if (params.options.type === 'xlsx') {
    exportXLSX(params);
    return false;
  }
}
/**
 * 基于 vxe-table 表格的增强插件，支持导出 xlsx 格式
 */


var VXETablePluginExportXLSX = {
  install: function install(vxetable) {
    var interceptor = vxetable.interceptor;
    vxetable.setup({
      "export": {
        types: {
          xlsx: 0
        }
      }
    });
    interceptor.mixin({
      'event.import': handleImportEvent,
      'event.export': handleExportEvent
    });
  }
};
exports.VXETablePluginExportXLSX = VXETablePluginExportXLSX;

if (typeof window !== 'undefined' && window.VXETable && window.VXETable.use) {
  window.VXETable.use(VXETablePluginExportXLSX);
}

var _default = VXETablePluginExportXLSX;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIiwiaW5kZXguanMiXSwibmFtZXMiOlsiZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciIsImRlZmF1bHRDZWxsRm9udENvbG9yIiwiZGVmYXVsdENlbGxCb3JkZXJTdHlsZSIsImRlZmF1bHRDZWxsQm9yZGVyQ29sb3IiLCJnZXRDZWxsTGFiZWwiLCJjb2x1bW4iLCJjZWxsVmFsdWUiLCJjZWxsVHlwZSIsIlhFVXRpbHMiLCJ0b1ZhbHVlU3RyaW5nIiwiaXNOYU4iLCJOdW1iZXIiLCJsZW5ndGgiLCJnZXRGb290ZXJEYXRhIiwib3B0cyIsImZvb3RlckRhdGEiLCJmb290ZXJGaWx0ZXJNZXRob2QiLCJmaWx0ZXIiLCJpdGVtcyIsImluZGV4IiwiJHJvd0luZGV4IiwiZ2V0Rm9vdGVyQ2VsbFZhbHVlIiwiJHRhYmxlIiwicm93cyIsImdldFZNQ29sdW1uSW5kZXgiLCJnZXRWYWxpZENvbHVtbiIsImNoaWxkTm9kZXMiLCJpc0NvbEdyb3VwIiwic2V0RXhjZWxSb3dIZWlnaHQiLCJleGNlbFJvdyIsImhlaWdodCIsImZsb29yIiwic2V0RXhjZWxDZWxsU3R5bGUiLCJleGNlbENlbGwiLCJhbGlnbiIsInByb3RlY3Rpb24iLCJsb2NrZWQiLCJhbGlnbm1lbnQiLCJ2ZXJ0aWNhbCIsImhvcml6b250YWwiLCJmb250IiwibmFtZSIsInNpemUiLCJnZXREZWZhdWx0Qm9yZGVyU3R5bGUiLCJ0b3AiLCJzdHlsZSIsImNvbG9yIiwiYXJnYiIsImxlZnQiLCJib3R0b20iLCJyaWdodCIsImV4cG9ydFhMU1giLCJwYXJhbXMiLCJtc2dLZXkiLCJvcHRpb25zIiwiY29sdW1ucyIsImNvbGdyb3VwcyIsImRhdGFzIiwiJHZ4ZSIsInJvd0hlaWdodCIsImFsbEhlYWRlckFsaWduIiwiaGVhZGVyQWxpZ24iLCJhbGxBbGlnbiIsImFsbEZvb3RlckFsaWduIiwiZm9vdGVyQWxpZ24iLCJtb2RhbCIsInQiLCJtZXNzYWdlIiwic2hlZXROYW1lIiwiaXNIZWFkZXIiLCJpc0Zvb3RlciIsImlzTWVyZ2UiLCJpc0NvbGdyb3VwIiwib3JpZ2luYWwiLCJ1c2VTdHlsZSIsInNoZWV0TWV0aG9kIiwic2hvd01zZyIsIm1lcmdlQ2VsbHMiLCJnZXRNZXJnZUNlbGxzIiwiY29sTGlzdCIsImZvb3RMaXN0Iiwic2hlZXRDb2xzIiwic2hlZXRNZXJnZXMiLCJiZWZvcmVSb3dDb3VudCIsImNvbEhlYWQiLCJmb3JFYWNoIiwiaWQiLCJwcm9wZXJ0eSIsInJlbmRlcldpZHRoIiwiZ2V0VGl0bGUiLCJwdXNoIiwia2V5Iiwid2lkdGgiLCJjZWlsIiwiY29scyIsInJJbmRleCIsImdyb3VwSGVhZCIsIl9jb2xTcGFuIiwiX3Jvd1NwYW4iLCJ2YWxpZENvbHVtbiIsImNvbHVtbkluZGV4IiwiaW5kZXhPZiIsInMiLCJyIiwiYyIsImUiLCJtZXJnZUl0ZW0iLCJtZXJnZVJvd0luZGV4Iiwicm93IiwibWVyZ2VSb3dzcGFuIiwicm93c3BhbiIsIm1lcmdlQ29sSW5kZXgiLCJjb2wiLCJtZXJnZUNvbHNwYW4iLCJjb2xzcGFuIiwicm93TGlzdCIsIm1hcCIsIml0ZW0iLCJyZXN0IiwiZ2V0VGFibGVEYXRhIiwiZm9vdGVycyIsIm1lcmdlRm9vdGVySXRlbXMiLCJnZXRNZXJnZUZvb3Rlckl0ZW1zIiwiZXhwb3J0TWV0aG9kIiwid29ya2Jvb2siLCJFeGNlbEpTIiwiV29ya2Jvb2siLCJzaGVldCIsImFkZFdvcmtzaGVldCIsImNyZWF0b3IiLCJhZGRSb3dzIiwiZWFjaENlbGwiLCJleGNlbENvbCIsImdldENvbHVtbiIsImdldENvbHVtbkJ5SWQiLCJPYmplY3QiLCJhc3NpZ24iLCJib2xkIiwiZmlsbCIsInR5cGUiLCJwYXR0ZXJuIiwiZmdDb2xvciIsImJvcmRlciIsInNQYXJhbXMiLCJ3b3Jrc2hlZXQiLCJ4bHN4Iiwid3JpdGVCdWZmZXIiLCJ0aGVuIiwiYnVmZmVyIiwiYmxvYiIsIkJsb2IiLCJkb3dubG9hZEZpbGUiLCJjbG9zZSIsImNvbnRlbnQiLCJzdGF0dXMiLCJkdXJhdGlvbiIsInNldFRpbWVvdXQiLCJmaWxlbmFtZSIsIndpbmRvdyIsIm5hdmlnYXRvciIsIm1zU2F2ZUJsb2IiLCJsaW5rRWxlbSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInRhcmdldCIsImRvd25sb2FkIiwiaHJlZiIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJhbGVydCIsImNoZWNrSW1wb3J0RGF0YSIsInRhYmxlRmllbGRzIiwiZmllbGRzIiwic29tZSIsImZpZWxkIiwiaW1wb3J0RXJyb3IiLCJfaW1wb3J0UmVqZWN0IiwiaW1wb3J0WExTWCIsImZpbGUiLCJfaW1wb3J0UmVzb2x2ZSIsImZpbGVSZWFkZXIiLCJGaWxlUmVhZGVyIiwib25lcnJvciIsIm9ubG9hZCIsImV2bnQiLCJyZWFkZXJUYXJnZXQiLCJsb2FkIiwicmVzdWx0Iiwid2IiLCJmaXJzdFNoZWV0Iiwid29ya3NoZWV0cyIsInNoZWV0VmFsdWVzIiwiZ2V0U2hlZXRWYWx1ZXMiLCJmaWVsZEluZGV4IiwiZmluZEluZGV4T2YiLCJsaXN0IiwicmVjb3JkcyIsInNsaWNlIiwiY0luZGV4IiwicmVjb3JkIiwiaXNVbmRlZmluZWQiLCJjcmVhdGVEYXRhIiwiZGF0YSIsImxvYWRSZXN0IiwibW9kZSIsImluc2VydEF0IiwicmVsb2FkRGF0YSIsInJlYWRBc0FycmF5QnVmZmVyIiwiaGFuZGxlSW1wb3J0RXZlbnQiLCJoYW5kbGVFeHBvcnRFdmVudCIsIlZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWCIsImluc3RhbGwiLCJ2eGV0YWJsZSIsImludGVyY2VwdG9yIiwic2V0dXAiLCJ0eXBlcyIsIm1peGluIiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQVVBOzs7Ozs7OztBQUVBLElBQU1BLDRCQUE0QixHQUFHLFFBQXJDO0FBQ0EsSUFBTUMsb0JBQW9CLEdBQUcsUUFBN0I7QUFDQSxJQUFNQyxzQkFBc0IsR0FB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QUFnQkM7QUFGQSxLQUFsQjtBQUlEO0FBZHFDLENBQWpDOzs7QUFpQlAsSUFBSSxPQUFPdkQsTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsTUFBTSxDQUFDK0QsUUFBeEMsSUFBb0QvRCxNQUFNLENBQUMrRCxRQUFQLENBQWdCQyxHQUF4RSxFQUE2RTtBQUMzRWhFLEVBQUFBLE1BQU0sQ0FBQytELFFBQVAsQ0FBZ0JDLEdBQWhCLENBQW9CUix3QkFBcEI7QUFDRDs7ZUFFY0Esd0IiLCJmaWxlIjoiaW5kZXguY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMnXHJcbmltcG9ydCB7XHJcbiAgVlhFVGFibGUsXHJcbiAgVGFibGUsXHJcbiAgSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsXHJcbiAgSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMsXHJcbiAgQ29sdW1uQ29uZmlnLFxyXG4gIFRhYmxlRXhwb3J0Q29uZmlnLFxyXG4gIENvbHVtbkFsaWduXHJcbn0gZnJvbSAndnhlLXRhYmxlJ1xyXG5pbXBvcnQgKiBhcyBFeGNlbEpTIGZyb20gJ2V4Y2VsanMnXHJcblxyXG5jb25zdCBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yID0gJ2Y4ZjhmOSdcclxuY29uc3QgZGVmYXVsdENlbGxGb250Q29sb3IgPSAnNjA2MjY2J1xyXG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlID0gJ3RoaW4nXHJcbmNvbnN0IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3IgPSAnZThlYWVjJ1xyXG5cclxuZnVuY3Rpb24gZ2V0Q2VsbExhYmVsIChjb2x1bW46IENvbHVtbkNvbmZpZywgY2VsbFZhbHVlOiBhbnkpIHtcclxuICBpZiAoY2VsbFZhbHVlKSB7XHJcbiAgICBzd2l0Y2ggKGNvbHVtbi5jZWxsVHlwZSkge1xyXG4gICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgIHJldHVybiBYRVV0aWxzLnRvVmFsdWVTdHJpbmcoY2VsbFZhbHVlKVxyXG4gICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgIGlmICghaXNOYU4oY2VsbFZhbHVlKSkge1xyXG4gICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgaWYgKGNlbGxWYWx1ZS5sZW5ndGggPCAxMiAmJiAhaXNOYU4oY2VsbFZhbHVlKSkge1xyXG4gICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjZWxsVmFsdWVcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Rm9vdGVyRGF0YSAob3B0czogVGFibGVFeHBvcnRDb25maWcsIGZvb3RlckRhdGE6IGFueVtdW10pIHtcclxuICBjb25zdCB7IGZvb3RlckZpbHRlck1ldGhvZCB9ID0gb3B0c1xyXG4gIHJldHVybiBmb290ZXJGaWx0ZXJNZXRob2QgPyBmb290ZXJEYXRhLmZpbHRlcigoaXRlbXMsIGluZGV4KSA9PiBmb290ZXJGaWx0ZXJNZXRob2QoeyBpdGVtcywgJHJvd0luZGV4OiBpbmRleCB9KSkgOiBmb290ZXJEYXRhXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEZvb3RlckNlbGxWYWx1ZSAoJHRhYmxlOiBUYWJsZSwgb3B0czogVGFibGVFeHBvcnRDb25maWcsIHJvd3M6IGFueVtdLCBjb2x1bW46IENvbHVtbkNvbmZpZykge1xyXG4gIGNvbnN0IGNlbGxWYWx1ZSA9IGdldENlbGxMYWJlbChjb2x1bW4sIHJvd3NbJHRhYmxlLmdldFZNQ29sdW1uSW5kZXgoY29sdW1uKV0pXHJcbiAgcmV0dXJuIGNlbGxWYWx1ZVxyXG59XHJcblxyXG5kZWNsYXJlIG1vZHVsZSAndnhlLXRhYmxlJyB7XHJcbiAgaW50ZXJmYWNlIENvbHVtbkluZm8ge1xyXG4gICAgX3JvdzogYW55O1xyXG4gICAgX2NvbFNwYW46IG51bWJlcjtcclxuICAgIF9yb3dTcGFuOiBudW1iZXI7XHJcbiAgICBjaGlsZE5vZGVzOiBDb2x1bW5Db25maWdbXTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFZhbGlkQ29sdW1uIChjb2x1bW46IENvbHVtbkNvbmZpZyk6IENvbHVtbkNvbmZpZyB7XHJcbiAgY29uc3QgeyBjaGlsZE5vZGVzIH0gPSBjb2x1bW5cclxuICBjb25zdCBpc0NvbEdyb3VwID0gY2hpbGROb2RlcyAmJiBjaGlsZE5vZGVzLmxlbmd0aFxyXG4gIGlmIChpc0NvbEdyb3VwKSB7XHJcbiAgICByZXR1cm4gZ2V0VmFsaWRDb2x1bW4oY2hpbGROb2Rlc1swXSlcclxuICB9XHJcbiAgcmV0dXJuIGNvbHVtblxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFeGNlbFJvd0hlaWdodCAoZXhjZWxSb3c6IEV4Y2VsSlMuUm93LCBoZWlnaHQ6IG51bWJlcikge1xyXG4gIGlmIChoZWlnaHQpIHtcclxuICAgIGV4Y2VsUm93LmhlaWdodCA9IFhFVXRpbHMuZmxvb3IoaGVpZ2h0ICogMC43NSwgMTIpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFeGNlbENlbGxTdHlsZSAoZXhjZWxDZWxsOiBFeGNlbEpTLkNlbGwsIGFsaWduPzogQ29sdW1uQWxpZ24pIHtcclxuICBleGNlbENlbGwucHJvdGVjdGlvbiA9IHtcclxuICAgIGxvY2tlZDogZmFsc2VcclxuICB9XHJcbiAgZXhjZWxDZWxsLmFsaWdubWVudCA9IHtcclxuICAgIHZlcnRpY2FsOiAnbWlkZGxlJyxcclxuICAgIGhvcml6b250YWw6IGFsaWduIHx8ICdsZWZ0J1xyXG4gIH1cclxuICBleGNlbENlbGwuZm9udCA9IHtcclxuICAgIG5hbWU6ICdBcmlhbCcsXHJcbiAgICBzaXplOiA4XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUgKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICB0b3A6IHtcclxuICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXHJcbiAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGVmdDoge1xyXG4gICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcclxuICAgICAgY29sb3I6IHtcclxuICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBib3R0b206IHtcclxuICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXHJcbiAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmlnaHQ6IHtcclxuICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXHJcbiAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBleHBvcnRYTFNYIChwYXJhbXM6IEludGVyY2VwdG9yRXhwb3J0UGFyYW1zKSB7XHJcbiAgY29uc3QgbXNnS2V5ID0gJ3hsc3gnXHJcbiAgY29uc3QgeyAkdGFibGUsIG9wdGlvbnMsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMgfSA9IHBhcmFtc1xyXG4gIGNvbnN0IHsgJHZ4ZSwgcm93SGVpZ2h0LCBoZWFkZXJBbGlnbjogYWxsSGVhZGVyQWxpZ24sIGFsaWduOiBhbGxBbGlnbiwgZm9vdGVyQWxpZ246IGFsbEZvb3RlckFsaWduIH0gPSAkdGFibGVcclxuICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlXHJcbiAgY29uc3QgeyBtZXNzYWdlLCBzaGVldE5hbWUsIGlzSGVhZGVyLCBpc0Zvb3RlciwgaXNNZXJnZSwgaXNDb2xncm91cCwgb3JpZ2luYWwsIHVzZVN0eWxlLCBzaGVldE1ldGhvZCB9ID0gb3B0aW9uc1xyXG4gIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZVxyXG4gIGNvbnN0IG1lcmdlQ2VsbHMgPSAkdGFibGUuZ2V0TWVyZ2VDZWxscygpXHJcbiAgY29uc3QgY29sTGlzdDogYW55W10gPSBbXVxyXG4gIGNvbnN0IGZvb3RMaXN0OiBhbnlbXSA9IFtdXHJcbiAgY29uc3Qgc2hlZXRDb2xzOiBhbnlbXSA9IFtdXHJcbiAgY29uc3Qgc2hlZXRNZXJnZXM6IHsgczogeyByOiBudW1iZXIsIGM6IG51bWJlciB9LCBlOiB7IHI6IG51bWJlciwgYzogbnVtYmVyIH0gfVtdID0gW11cclxuICBsZXQgYmVmb3JlUm93Q291bnQgPSAwXHJcbiAgY29uc3QgY29sSGVhZDogYW55ID0ge31cclxuICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgY29uc3QgeyBpZCwgcHJvcGVydHksIHJlbmRlcldpZHRoIH0gPSBjb2x1bW5cclxuICAgIGNvbEhlYWRbaWRdID0gb3JpZ2luYWwgPyBwcm9wZXJ0eSA6IGNvbHVtbi5nZXRUaXRsZSgpXHJcbiAgICBzaGVldENvbHMucHVzaCh7XHJcbiAgICAgIGtleTogaWQsXHJcbiAgICAgIHdpZHRoOiBYRVV0aWxzLmNlaWwocmVuZGVyV2lkdGggLyA4LCAxKVxyXG4gICAgfSlcclxuICB9KVxyXG4gIC8vIOWkhOeQhuihqOWktFxyXG4gIGlmIChpc0hlYWRlcikge1xyXG4gICAgLy8g5aSE55CG5YiG57uEXHJcbiAgICBpZiAoaXNDb2xncm91cCAmJiAhb3JpZ2luYWwgJiYgY29sZ3JvdXBzKSB7XHJcbiAgICAgIGNvbGdyb3Vwcy5mb3JFYWNoKChjb2xzLCBySW5kZXgpID0+IHtcclxuICAgICAgICBjb25zdCBncm91cEhlYWQ6IGFueSA9IHt9XHJcbiAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgICAgIGdyb3VwSGVhZFtjb2x1bW4uaWRdID0gbnVsbFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29scy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgICAgIGNvbnN0IHsgX2NvbFNwYW4sIF9yb3dTcGFuIH0gPSBjb2x1bW5cclxuICAgICAgICAgIGNvbnN0IHZhbGlkQ29sdW1uID0gZ2V0VmFsaWRDb2x1bW4oY29sdW1uKVxyXG4gICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBjb2x1bW5zLmluZGV4T2YodmFsaWRDb2x1bW4pXHJcbiAgICAgICAgICBncm91cEhlYWRbdmFsaWRDb2x1bW4uaWRdID0gb3JpZ2luYWwgPyB2YWxpZENvbHVtbi5wcm9wZXJ0eSA6IGNvbHVtbi5nZXRUaXRsZSgpXHJcbiAgICAgICAgICBpZiAoX2NvbFNwYW4gPiAxIHx8IF9yb3dTcGFuID4gMSkge1xyXG4gICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcclxuICAgICAgICAgICAgICBzOiB7IHI6IHJJbmRleCwgYzogY29sdW1uSW5kZXggfSxcclxuICAgICAgICAgICAgICBlOiB7IHI6IHJJbmRleCArIF9yb3dTcGFuIC0gMSwgYzogY29sdW1uSW5kZXggKyBfY29sU3BhbiAtIDEgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29sTGlzdC5wdXNoKGdyb3VwSGVhZClcclxuICAgICAgfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbExpc3QucHVzaChjb2xIZWFkKVxyXG4gICAgfVxyXG4gICAgYmVmb3JlUm93Q291bnQgKz0gY29sTGlzdC5sZW5ndGhcclxuICB9XHJcbiAgLy8g5aSE55CG5ZCI5bm2XHJcbiAgaWYgKGlzTWVyZ2UgJiYgIW9yaWdpbmFsKSB7XHJcbiAgICBtZXJnZUNlbGxzLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcclxuICAgICAgY29uc3QgeyByb3c6IG1lcmdlUm93SW5kZXgsIHJvd3NwYW46IG1lcmdlUm93c3BhbiwgY29sOiBtZXJnZUNvbEluZGV4LCBjb2xzcGFuOiBtZXJnZUNvbHNwYW4gfSA9IG1lcmdlSXRlbVxyXG4gICAgICBzaGVldE1lcmdlcy5wdXNoKHtcclxuICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxyXG4gICAgICAgIGU6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50ICsgbWVyZ2VSb3dzcGFuIC0gMSwgYzogbWVyZ2VDb2xJbmRleCArIG1lcmdlQ29sc3BhbiAtIDEgfVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcbiAgY29uc3Qgcm93TGlzdCA9IGRhdGFzLm1hcChpdGVtID0+IHtcclxuICAgIGNvbnN0IHJlc3Q6IGFueSA9IHt9XHJcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgICByZXN0W2NvbHVtbi5pZF0gPSBnZXRDZWxsTGFiZWwoY29sdW1uLCBpdGVtW2NvbHVtbi5pZF0pXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHJlc3RcclxuICB9KVxyXG4gIGJlZm9yZVJvd0NvdW50ICs9IHJvd0xpc3QubGVuZ3RoXHJcbiAgLy8g5aSE55CG6KGo5bC+XHJcbiAgaWYgKGlzRm9vdGVyKSB7XHJcbiAgICBjb25zdCB7IGZvb3RlckRhdGEgfSA9ICR0YWJsZS5nZXRUYWJsZURhdGEoKVxyXG4gICAgY29uc3QgZm9vdGVycyA9IGdldEZvb3RlckRhdGEob3B0aW9ucywgZm9vdGVyRGF0YSlcclxuICAgIGNvbnN0IG1lcmdlRm9vdGVySXRlbXMgPSAkdGFibGUuZ2V0TWVyZ2VGb290ZXJJdGVtcygpXHJcbiAgICAvLyDlpITnkIblkIjlubZcclxuICAgIGlmIChpc01lcmdlICYmICFvcmlnaW5hbCkge1xyXG4gICAgICBtZXJnZUZvb3Rlckl0ZW1zLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcclxuICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtXHJcbiAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XHJcbiAgICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxyXG4gICAgICAgICAgZTogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQgKyBtZXJnZVJvd3NwYW4gLSAxLCBjOiBtZXJnZUNvbEluZGV4ICsgbWVyZ2VDb2xzcGFuIC0gMSB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGZvb3RlcnMuZm9yRWFjaCgocm93cykgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtOiBhbnkgPSB7fVxyXG4gICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgICAgIGl0ZW1bY29sdW1uLmlkXSA9IGdldEZvb3RlckNlbGxWYWx1ZSgkdGFibGUsIG9wdGlvbnMsIHJvd3MsIGNvbHVtbilcclxuICAgICAgfSlcclxuICAgICAgZm9vdExpc3QucHVzaChpdGVtKVxyXG4gICAgfSlcclxuICB9XHJcbiAgY29uc3QgZXhwb3J0TWV0aG9kID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpXHJcbiAgICBjb25zdCBzaGVldCA9IHdvcmtib29rLmFkZFdvcmtzaGVldChzaGVldE5hbWUpXHJcbiAgICB3b3JrYm9vay5jcmVhdG9yID0gJ3Z4ZS10YWJsZSdcclxuICAgIHNoZWV0LmNvbHVtbnMgPSBzaGVldENvbHNcclxuICAgIGlmIChpc0hlYWRlcikge1xyXG4gICAgICBzaGVldC5hZGRSb3dzKGNvbExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xyXG4gICAgICAgIGlmICh1c2VTdHlsZSkge1xyXG4gICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodClcclxuICAgICAgICB9XHJcbiAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcclxuICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpXHJcbiAgICAgICAgICBjb25zdCBjb2x1bW46IGFueSA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSBhcyBzdHJpbmcpXHJcbiAgICAgICAgICBjb25zdCB7IGhlYWRlckFsaWduLCBhbGlnbiB9ID0gY29sdW1uXHJcbiAgICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGhlYWRlckFsaWduIHx8IGFsaWduIHx8IGFsbEhlYWRlckFsaWduIHx8IGFsbEFsaWduKVxyXG4gICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XHJcbiAgICAgICAgICAgICAgZm9udDoge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ0FyaWFsJyxcclxuICAgICAgICAgICAgICAgIGJvbGQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6IHtcclxuICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzaXplOiA4XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBmaWxsOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAncGF0dGVybicsXHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAnc29saWQnLFxyXG4gICAgICAgICAgICAgICAgZmdDb2xvcjoge1xyXG4gICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xyXG4gICAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXHJcbiAgICAgICAgICAgICAgICBib2xkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHNpemU6IDhcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHNoZWV0LmFkZFJvd3Mocm93TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XHJcbiAgICAgIGlmICh1c2VTdHlsZSkge1xyXG4gICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpXHJcbiAgICAgIH1cclxuICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcclxuICAgICAgICBjb25zdCBleGNlbENvbCA9IHNoZWV0LmdldENvbHVtbihleGNlbENlbGwuY29sKVxyXG4gICAgICAgIGNvbnN0IGNvbHVtbjogYW55ID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5IGFzIHN0cmluZylcclxuICAgICAgICBjb25zdCB7IGFsaWduIH0gPSBjb2x1bW5cclxuICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGFsaWduIHx8IGFsbEFsaWduKVxyXG4gICAgICAgIGlmICh1c2VTdHlsZSkge1xyXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcclxuICAgICAgICAgICAgZm9udDoge1xyXG4gICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXHJcbiAgICAgICAgICAgICAgc2l6ZTogOCxcclxuICAgICAgICAgICAgICBjb2xvcjoge1xyXG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XHJcbiAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgICAgICAgICAgIGJvbGQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIHNpemU6IDhcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgaWYgKGlzRm9vdGVyKSB7XHJcbiAgICAgIHNoZWV0LmFkZFJvd3MoZm9vdExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xyXG4gICAgICAgIGlmICh1c2VTdHlsZSkge1xyXG4gICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodClcclxuICAgICAgICB9XHJcbiAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcclxuICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpXHJcbiAgICAgICAgICBjb25zdCBjb2x1bW46IGFueSA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSBhcyBzdHJpbmcpXHJcbiAgICAgICAgICBjb25zdCB7IGZvb3RlckFsaWduLCBhbGlnbiB9ID0gY29sdW1uXHJcbiAgICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGZvb3RlckFsaWduIHx8IGFsaWduIHx8IGFsbEZvb3RlckFsaWduIHx8IGFsbEFsaWduKVxyXG4gICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XHJcbiAgICAgICAgICAgICAgZm9udDoge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ0FyaWFsJyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDgsXHJcbiAgICAgICAgICAgICAgICBjb2xvcjoge1xyXG4gICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcclxuICAgICAgICAgICAgICBmb250OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgICAgICAgICAgICAgYm9sZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzaXplOiA4XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBpZiAodXNlU3R5bGUgJiYgc2hlZXRNZXRob2QpIHtcclxuICAgICAgY29uc3Qgc1BhcmFtcyA9IHsgb3B0aW9uczogb3B0aW9ucyBhcyBhbnksIHdvcmtib29rLCB3b3Jrc2hlZXQ6IHNoZWV0LCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzLCAkdGFibGUgfVxyXG4gICAgICBzaGVldE1ldGhvZChzUGFyYW1zKVxyXG4gICAgfVxyXG4gICAgc2hlZXRNZXJnZXMuZm9yRWFjaCgoeyBzLCBlIH0pID0+IHtcclxuICAgICAgc2hlZXQubWVyZ2VDZWxscyhzLnIgKyAxLCBzLmMgKyAxLCBlLnIgKyAxLCBlLmMgKyAxKVxyXG4gICAgfSlcclxuICAgIHdvcmtib29rLnhsc3gud3JpdGVCdWZmZXIoKS50aGVuKGJ1ZmZlciA9PiB7XHJcbiAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyB9KVxyXG4gICAgICAvLyDlr7zlh7ogeGxzeFxyXG4gICAgICBkb3dubG9hZEZpbGUocGFyYW1zLCBibG9iLCBvcHRpb25zKVxyXG4gICAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xyXG4gICAgICAgIG1vZGFsLmNsb3NlKG1zZ0tleSlcclxuICAgICAgICBtb2RhbC5tZXNzYWdlKHsgY29udGVudDogdCgndnhlLnRhYmxlLmV4cFN1Y2Nlc3MnKSBhcyBzdHJpbmcsIHN0YXR1czogJ3N1Y2Nlc3MnIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG4gIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XHJcbiAgICBtb2RhbC5tZXNzYWdlKHsgaWQ6IG1zZ0tleSwgY29udGVudDogdCgndnhlLnRhYmxlLmV4cExvYWRpbmcnKSBhcyBzdHJpbmcsIHN0YXR1czogJ2xvYWRpbmcnLCBkdXJhdGlvbjogLTEgfSlcclxuICAgIHNldFRpbWVvdXQoZXhwb3J0TWV0aG9kLCAxNTAwKVxyXG4gIH0gZWxzZSB7XHJcbiAgICBleHBvcnRNZXRob2QoKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZG93bmxvYWRGaWxlIChwYXJhbXM6IEludGVyY2VwdG9yRXhwb3J0UGFyYW1zLCBibG9iOiBCbG9iLCBvcHRpb25zOiBUYWJsZUV4cG9ydENvbmZpZykge1xyXG4gIGNvbnN0IHsgJHRhYmxlIH0gPSBwYXJhbXNcclxuICBjb25zdCB7ICR2eGUgfSA9ICR0YWJsZVxyXG4gIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGVcclxuICBjb25zdCB7IG1lc3NhZ2UsIGZpbGVuYW1lLCB0eXBlIH0gPSBvcHRpb25zXHJcbiAgY29uc3Qgc2hvd01zZyA9IG1lc3NhZ2UgIT09IGZhbHNlXHJcbiAgaWYgKHdpbmRvdy5CbG9iKSB7XHJcbiAgICBpZiAoKG5hdmlnYXRvciBhcyBhbnkpLm1zU2F2ZUJsb2IpIHtcclxuICAgICAgKG5hdmlnYXRvciBhcyBhbnkpLm1zU2F2ZUJsb2IoYmxvYiwgYCR7ZmlsZW5hbWV9LiR7dHlwZX1gKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgbGlua0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcclxuICAgICAgbGlua0VsZW0udGFyZ2V0ID0gJ19ibGFuaydcclxuICAgICAgbGlua0VsZW0uZG93bmxvYWQgPSBgJHtmaWxlbmFtZX0uJHt0eXBlfWBcclxuICAgICAgbGlua0VsZW0uaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYilcclxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rRWxlbSlcclxuICAgICAgbGlua0VsZW0uY2xpY2soKVxyXG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmtFbGVtKVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xyXG4gICAgICBtb2RhbC5hbGVydCh7IGNvbnRlbnQ6IHQoJ3Z4ZS5lcnJvci5ub3RFeHAnKSBhcyBzdHJpbmcsIHN0YXR1czogJ2Vycm9yJyB9KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tJbXBvcnREYXRhICh0YWJsZUZpZWxkczogc3RyaW5nW10sIGZpZWxkczogc3RyaW5nW10pIHtcclxuICByZXR1cm4gZmllbGRzLnNvbWUoZmllbGQgPT4gdGFibGVGaWVsZHMuaW5kZXhPZihmaWVsZCkgPiAtMSlcclxufVxyXG5cclxuZGVjbGFyZSBtb2R1bGUgJ3Z4ZS10YWJsZScge1xyXG4gIGludGVyZmFjZSBUYWJsZSB7XHJcbiAgICBfaW1wb3J0UmVzb2x2ZT86IEZ1bmN0aW9uIHwgbnVsbDtcclxuICAgIF9pbXBvcnRSZWplY3Q/OiBGdW5jdGlvbiB8IG51bGw7XHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIGltcG9ydEVycm9yIChwYXJhbXM6IEludGVyY2VwdG9ySW1wb3J0UGFyYW1zKSB7XHJcbiAgY29uc3QgeyAkdGFibGUsIG9wdGlvbnMgfSA9IHBhcmFtc1xyXG4gIGNvbnN0IHsgJHZ4ZSwgX2ltcG9ydFJlamVjdCB9ID0gJHRhYmxlXHJcbiAgY29uc3Qgc2hvd01zZyA9IG9wdGlvbnMubWVzc2FnZSAhPT0gZmFsc2VcclxuICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlXHJcbiAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcclxuICAgIG1vZGFsLm1lc3NhZ2UoeyBjb250ZW50OiB0KCd2eGUuZXJyb3IuaW1wRmllbGRzJykgYXMgc3RyaW5nLCBzdGF0dXM6ICdlcnJvcicgfSlcclxuICB9XHJcbiAgaWYgKF9pbXBvcnRSZWplY3QpIHtcclxuICAgIF9pbXBvcnRSZWplY3QoeyBzdGF0dXM6IGZhbHNlIH0pXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbXBvcnRYTFNYIChwYXJhbXM6IEludGVyY2VwdG9ySW1wb3J0UGFyYW1zKSB7XHJcbiAgY29uc3QgeyAkdGFibGUsIGNvbHVtbnMsIG9wdGlvbnMsIGZpbGUgfSA9IHBhcmFtc1xyXG4gIGNvbnN0IHsgJHZ4ZSwgX2ltcG9ydFJlc29sdmUgfSA9ICR0YWJsZVxyXG4gIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGVcclxuICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZVxyXG4gIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcbiAgZmlsZVJlYWRlci5vbmVycm9yID0gKCkgPT4ge1xyXG4gICAgaW1wb3J0RXJyb3IocGFyYW1zKVxyXG4gIH1cclxuICBmaWxlUmVhZGVyLm9ubG9hZCA9IChldm50KSA9PiB7XHJcbiAgICBjb25zdCB0YWJsZUZpZWxkczogc3RyaW5nW10gPSBbXVxyXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgY29uc3QgZmllbGQgPSBjb2x1bW4ucHJvcGVydHlcclxuICAgICAgaWYgKGZpZWxkKSB7XHJcbiAgICAgICAgdGFibGVGaWVsZHMucHVzaChmaWVsZClcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxyXG4gICAgY29uc3QgcmVhZGVyVGFyZ2V0ID0gZXZudC50YXJnZXRcclxuICAgIGlmIChyZWFkZXJUYXJnZXQpIHtcclxuICAgICAgd29ya2Jvb2sueGxzeC5sb2FkKHJlYWRlclRhcmdldC5yZXN1bHQgYXMgQXJyYXlCdWZmZXIpLnRoZW4od2IgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZpcnN0U2hlZXQgPSB3Yi53b3Jrc2hlZXRzWzBdXHJcbiAgICAgICAgaWYgKGZpcnN0U2hlZXQpIHtcclxuICAgICAgICAgIGNvbnN0IHNoZWV0VmFsdWVzID0gZmlyc3RTaGVldC5nZXRTaGVldFZhbHVlcygpIGFzIHN0cmluZ1tdW11cclxuICAgICAgICAgIGNvbnN0IGZpZWxkSW5kZXggPSBYRVV0aWxzLmZpbmRJbmRleE9mKHNoZWV0VmFsdWVzLCAobGlzdCkgPT4gbGlzdCAmJiBsaXN0Lmxlbmd0aCA+IDApXHJcbiAgICAgICAgICBjb25zdCBmaWVsZHMgPSBzaGVldFZhbHVlc1tmaWVsZEluZGV4XSBhcyBzdHJpbmdbXVxyXG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gY2hlY2tJbXBvcnREYXRhKHRhYmxlRmllbGRzLCBmaWVsZHMpXHJcbiAgICAgICAgICBpZiAoc3RhdHVzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlY29yZHMgPSBzaGVldFZhbHVlcy5zbGljZShmaWVsZEluZGV4KS5tYXAobGlzdCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaXRlbSA6IGFueSA9IHt9XHJcbiAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKChjZWxsVmFsdWUsIGNJbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaXRlbVtmaWVsZHNbY0luZGV4XV0gPSBjZWxsVmFsdWVcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIGNvbnN0IHJlY29yZDogYW55ID0ge31cclxuICAgICAgICAgICAgICB0YWJsZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcclxuICAgICAgICAgICAgICAgIHJlY29yZFtmaWVsZF0gPSBYRVV0aWxzLmlzVW5kZWZpbmVkKGl0ZW1bZmllbGRdKSA/IG51bGwgOiBpdGVtW2ZpZWxkXVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAkdGFibGUuY3JlYXRlRGF0YShyZWNvcmRzKVxyXG4gICAgICAgICAgICAgIC50aGVuKChkYXRhOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGxvYWRSZXN0OiBQcm9taXNlPGFueT5cclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm1vZGUgPT09ICdpbnNlcnQnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGxvYWRSZXN0ID0gJHRhYmxlLmluc2VydEF0KGRhdGEsIC0xKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUucmVsb2FkRGF0YShkYXRhKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRSZXN0LnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBpZiAoX2ltcG9ydFJlc29sdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBfaW1wb3J0UmVzb2x2ZSh7IHN0YXR1czogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XHJcbiAgICAgICAgICAgICAgbW9kYWwubWVzc2FnZSh7IGNvbnRlbnQ6IHQoJ3Z4ZS50YWJsZS5pbXBTdWNjZXNzJywgW3JlY29yZHMubGVuZ3RoXSkgYXMgc3RyaW5nLCBzdGF0dXM6ICdzdWNjZXNzJyB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbXBvcnRFcnJvcihwYXJhbXMpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSlcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlSW1wb3J0RXZlbnQgKHBhcmFtczogSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMpIHtcclxuICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XHJcbiAgICBpbXBvcnRYTFNYKHBhcmFtcylcclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlRXhwb3J0RXZlbnQgKHBhcmFtczogSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMpIHtcclxuICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XHJcbiAgICBleHBvcnRYTFNYKHBhcmFtcylcclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIOWfuuS6jiB2eGUtdGFibGUg6KGo5qC855qE5aKe5by65o+S5Lu277yM5pSv5oyB5a+85Ye6IHhsc3gg5qC85byPXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYID0ge1xyXG4gIGluc3RhbGwgKHZ4ZXRhYmxlOiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICAgIGNvbnN0IHsgaW50ZXJjZXB0b3IgfSA9IHZ4ZXRhYmxlXHJcbiAgICB2eGV0YWJsZS5zZXR1cCh7XHJcbiAgICAgIGV4cG9ydDoge1xyXG4gICAgICAgIHR5cGVzOiB7XHJcbiAgICAgICAgICB4bHN4OiAwXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgaW50ZXJjZXB0b3IubWl4aW4oe1xyXG4gICAgICAnZXZlbnQuaW1wb3J0JzogaGFuZGxlSW1wb3J0RXZlbnQsXHJcbiAgICAgICdldmVudC5leHBvcnQnOiBoYW5kbGVFeHBvcnRFdmVudFxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuVlhFVGFibGUgJiYgd2luZG93LlZYRVRhYmxlLnVzZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYKVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1hcclxuIiwiaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMnO1xuaW1wb3J0ICogYXMgRXhjZWxKUyBmcm9tICdleGNlbGpzJztcbmNvbnN0IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3IgPSAnZjhmOGY5JztcbmNvbnN0IGRlZmF1bHRDZWxsRm9udENvbG9yID0gJzYwNjI2Nic7XG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlID0gJ3RoaW4nO1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJDb2xvciA9ICdlOGVhZWMnO1xuZnVuY3Rpb24gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgY2VsbFZhbHVlKSB7XG4gICAgaWYgKGNlbGxWYWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKGNvbHVtbi5jZWxsVHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gWEVVdGlscy50b1ZhbHVlU3RyaW5nKGNlbGxWYWx1ZSk7XG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGlmICghaXNOYU4oY2VsbFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKGNlbGxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAoY2VsbFZhbHVlLmxlbmd0aCA8IDEyICYmICFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNlbGxWYWx1ZTtcbn1cbmZ1bmN0aW9uIGdldEZvb3RlckRhdGEob3B0cywgZm9vdGVyRGF0YSkge1xuICAgIGNvbnN0IHsgZm9vdGVyRmlsdGVyTWV0aG9kIH0gPSBvcHRzO1xuICAgIHJldHVybiBmb290ZXJGaWx0ZXJNZXRob2QgPyBmb290ZXJEYXRhLmZpbHRlcigoaXRlbXMsIGluZGV4KSA9PiBmb290ZXJGaWx0ZXJNZXRob2QoeyBpdGVtcywgJHJvd0luZGV4OiBpbmRleCB9KSkgOiBmb290ZXJEYXRhO1xufVxuZnVuY3Rpb24gZ2V0Rm9vdGVyQ2VsbFZhbHVlKCR0YWJsZSwgb3B0cywgcm93cywgY29sdW1uKSB7XG4gICAgY29uc3QgY2VsbFZhbHVlID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgcm93c1skdGFibGUuZ2V0Vk1Db2x1bW5JbmRleChjb2x1bW4pXSk7XG4gICAgcmV0dXJuIGNlbGxWYWx1ZTtcbn1cbmZ1bmN0aW9uIGdldFZhbGlkQ29sdW1uKGNvbHVtbikge1xuICAgIGNvbnN0IHsgY2hpbGROb2RlcyB9ID0gY29sdW1uO1xuICAgIGNvbnN0IGlzQ29sR3JvdXAgPSBjaGlsZE5vZGVzICYmIGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgIGlmIChpc0NvbEdyb3VwKSB7XG4gICAgICAgIHJldHVybiBnZXRWYWxpZENvbHVtbihjaGlsZE5vZGVzWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbHVtbjtcbn1cbmZ1bmN0aW9uIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCBoZWlnaHQpIHtcbiAgICBpZiAoaGVpZ2h0KSB7XG4gICAgICAgIGV4Y2VsUm93LmhlaWdodCA9IFhFVXRpbHMuZmxvb3IoaGVpZ2h0ICogMC43NSwgMTIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24pIHtcbiAgICBleGNlbENlbGwucHJvdGVjdGlvbiA9IHtcbiAgICAgICAgbG9ja2VkOiBmYWxzZVxuICAgIH07XG4gICAgZXhjZWxDZWxsLmFsaWdubWVudCA9IHtcbiAgICAgICAgdmVydGljYWw6ICdtaWRkbGUnLFxuICAgICAgICBob3Jpem9udGFsOiBhbGlnbiB8fCAnbGVmdCdcbiAgICB9O1xuICAgIGV4Y2VsQ2VsbC5mb250ID0ge1xuICAgICAgICBuYW1lOiAnQXJpYWwnLFxuICAgICAgICBzaXplOiA4XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGdldERlZmF1bHRCb3JkZXJTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0b3A6IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxlZnQ6IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGJvdHRvbToge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmlnaHQ6IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gZXhwb3J0WExTWChwYXJhbXMpIHtcbiAgICBjb25zdCBtc2dLZXkgPSAneGxzeCc7XG4gICAgY29uc3QgeyAkdGFibGUsIG9wdGlvbnMsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMgfSA9IHBhcmFtcztcbiAgICBjb25zdCB7ICR2eGUsIHJvd0hlaWdodCwgaGVhZGVyQWxpZ246IGFsbEhlYWRlckFsaWduLCBhbGlnbjogYWxsQWxpZ24sIGZvb3RlckFsaWduOiBhbGxGb290ZXJBbGlnbiB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGU7XG4gICAgY29uc3QgeyBtZXNzYWdlLCBzaGVldE5hbWUsIGlzSGVhZGVyLCBpc0Zvb3RlciwgaXNNZXJnZSwgaXNDb2xncm91cCwgb3JpZ2luYWwsIHVzZVN0eWxlLCBzaGVldE1ldGhvZCB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2U7XG4gICAgY29uc3QgbWVyZ2VDZWxscyA9ICR0YWJsZS5nZXRNZXJnZUNlbGxzKCk7XG4gICAgY29uc3QgY29sTGlzdCA9IFtdO1xuICAgIGNvbnN0IGZvb3RMaXN0ID0gW107XG4gICAgY29uc3Qgc2hlZXRDb2xzID0gW107XG4gICAgY29uc3Qgc2hlZXRNZXJnZXMgPSBbXTtcbiAgICBsZXQgYmVmb3JlUm93Q291bnQgPSAwO1xuICAgIGNvbnN0IGNvbEhlYWQgPSB7fTtcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICBjb25zdCB7IGlkLCBwcm9wZXJ0eSwgcmVuZGVyV2lkdGggfSA9IGNvbHVtbjtcbiAgICAgICAgY29sSGVhZFtpZF0gPSBvcmlnaW5hbCA/IHByb3BlcnR5IDogY29sdW1uLmdldFRpdGxlKCk7XG4gICAgICAgIHNoZWV0Q29scy5wdXNoKHtcbiAgICAgICAgICAgIGtleTogaWQsXG4gICAgICAgICAgICB3aWR0aDogWEVVdGlscy5jZWlsKHJlbmRlcldpZHRoIC8gOCwgMSlcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLy8g5aSE55CG6KGo5aS0XG4gICAgaWYgKGlzSGVhZGVyKSB7XG4gICAgICAgIC8vIOWkhOeQhuWIhue7hFxuICAgICAgICBpZiAoaXNDb2xncm91cCAmJiAhb3JpZ2luYWwgJiYgY29sZ3JvdXBzKSB7XG4gICAgICAgICAgICBjb2xncm91cHMuZm9yRWFjaCgoY29scywgckluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBIZWFkID0ge307XG4gICAgICAgICAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBIZWFkW2NvbHVtbi5pZF0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbHMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgX2NvbFNwYW4sIF9yb3dTcGFuIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkQ29sdW1uID0gZ2V0VmFsaWRDb2x1bW4oY29sdW1uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBjb2x1bW5zLmluZGV4T2YodmFsaWRDb2x1bW4pO1xuICAgICAgICAgICAgICAgICAgICBncm91cEhlYWRbdmFsaWRDb2x1bW4uaWRdID0gb3JpZ2luYWwgPyB2YWxpZENvbHVtbi5wcm9wZXJ0eSA6IGNvbHVtbi5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2NvbFNwYW4gPiAxIHx8IF9yb3dTcGFuID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczogeyByOiBySW5kZXgsIGM6IGNvbHVtbkluZGV4IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZTogeyByOiBySW5kZXggKyBfcm93U3BhbiAtIDEsIGM6IGNvbHVtbkluZGV4ICsgX2NvbFNwYW4gLSAxIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29sTGlzdC5wdXNoKGdyb3VwSGVhZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbExpc3QucHVzaChjb2xIZWFkKTtcbiAgICAgICAgfVxuICAgICAgICBiZWZvcmVSb3dDb3VudCArPSBjb2xMaXN0Lmxlbmd0aDtcbiAgICB9XG4gICAgLy8g5aSE55CG5ZCI5bm2XG4gICAgaWYgKGlzTWVyZ2UgJiYgIW9yaWdpbmFsKSB7XG4gICAgICAgIG1lcmdlQ2VsbHMuZm9yRWFjaChtZXJnZUl0ZW0gPT4ge1xuICAgICAgICAgICAgY29uc3QgeyByb3c6IG1lcmdlUm93SW5kZXgsIHJvd3NwYW46IG1lcmdlUm93c3BhbiwgY29sOiBtZXJnZUNvbEluZGV4LCBjb2xzcGFuOiBtZXJnZUNvbHNwYW4gfSA9IG1lcmdlSXRlbTtcbiAgICAgICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHM6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50LCBjOiBtZXJnZUNvbEluZGV4IH0sXG4gICAgICAgICAgICAgICAgZTogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQgKyBtZXJnZVJvd3NwYW4gLSAxLCBjOiBtZXJnZUNvbEluZGV4ICsgbWVyZ2VDb2xzcGFuIC0gMSB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJvd0xpc3QgPSBkYXRhcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3QgPSB7fTtcbiAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgIHJlc3RbY29sdW1uLmlkXSA9IGdldENlbGxMYWJlbChjb2x1bW4sIGl0ZW1bY29sdW1uLmlkXSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdDtcbiAgICB9KTtcbiAgICBiZWZvcmVSb3dDb3VudCArPSByb3dMaXN0Lmxlbmd0aDtcbiAgICAvLyDlpITnkIbooajlsL5cbiAgICBpZiAoaXNGb290ZXIpIHtcbiAgICAgICAgY29uc3QgeyBmb290ZXJEYXRhIH0gPSAkdGFibGUuZ2V0VGFibGVEYXRhKCk7XG4gICAgICAgIGNvbnN0IGZvb3RlcnMgPSBnZXRGb290ZXJEYXRhKG9wdGlvbnMsIGZvb3RlckRhdGEpO1xuICAgICAgICBjb25zdCBtZXJnZUZvb3Rlckl0ZW1zID0gJHRhYmxlLmdldE1lcmdlRm9vdGVySXRlbXMoKTtcbiAgICAgICAgLy8g5aSE55CG5ZCI5bm2XG4gICAgICAgIGlmIChpc01lcmdlICYmICFvcmlnaW5hbCkge1xuICAgICAgICAgICAgbWVyZ2VGb290ZXJJdGVtcy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyByb3c6IG1lcmdlUm93SW5kZXgsIHJvd3NwYW46IG1lcmdlUm93c3BhbiwgY29sOiBtZXJnZUNvbEluZGV4LCBjb2xzcGFuOiBtZXJnZUNvbHNwYW4gfSA9IG1lcmdlSXRlbTtcbiAgICAgICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcbiAgICAgICAgICAgICAgICAgICAgZTogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQgKyBtZXJnZVJvd3NwYW4gLSAxLCBjOiBtZXJnZUNvbEluZGV4ICsgbWVyZ2VDb2xzcGFuIC0gMSB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmb290ZXJzLmZvckVhY2goKHJvd3MpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB7fTtcbiAgICAgICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICAgICAgaXRlbVtjb2x1bW4uaWRdID0gZ2V0Rm9vdGVyQ2VsbFZhbHVlKCR0YWJsZSwgb3B0aW9ucywgcm93cywgY29sdW1uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm9vdExpc3QucHVzaChpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IGV4cG9ydE1ldGhvZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpO1xuICAgICAgICBjb25zdCBzaGVldCA9IHdvcmtib29rLmFkZFdvcmtzaGVldChzaGVldE5hbWUpO1xuICAgICAgICB3b3JrYm9vay5jcmVhdG9yID0gJ3Z4ZS10YWJsZSc7XG4gICAgICAgIHNoZWV0LmNvbHVtbnMgPSBzaGVldENvbHM7XG4gICAgICAgIGlmIChpc0hlYWRlcikge1xuICAgICAgICAgICAgc2hlZXQuYWRkUm93cyhjb2xMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW4gPSAkdGFibGUuZ2V0Q29sdW1uQnlJZChleGNlbENvbC5rZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGhlYWRlckFsaWduLCBhbGlnbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGhlYWRlckFsaWduIHx8IGFsaWduIHx8IGFsbEhlYWRlckFsaWduIHx8IGFsbEFsaWduKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0FyaWFsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9sZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiA4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwYXR0ZXJuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogJ3NvbGlkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmdDb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2xkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogOFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzaGVldC5hZGRSb3dzKHJvd0xpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvbGQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDhcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNGb290ZXIpIHtcbiAgICAgICAgICAgIHNoZWV0LmFkZFJvd3MoZm9vdExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZm9vdGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgZm9vdGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsRm9vdGVyQWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiA4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0FyaWFsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9sZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZVN0eWxlICYmIHNoZWV0TWV0aG9kKSB7XG4gICAgICAgICAgICBjb25zdCBzUGFyYW1zID0geyBvcHRpb25zOiBvcHRpb25zLCB3b3JrYm9vaywgd29ya3NoZWV0OiBzaGVldCwgY29sdW1ucywgY29sZ3JvdXBzLCBkYXRhcywgJHRhYmxlIH07XG4gICAgICAgICAgICBzaGVldE1ldGhvZChzUGFyYW1zKTtcbiAgICAgICAgfVxuICAgICAgICBzaGVldE1lcmdlcy5mb3JFYWNoKCh7IHMsIGUgfSkgPT4ge1xuICAgICAgICAgICAgc2hlZXQubWVyZ2VDZWxscyhzLnIgKyAxLCBzLmMgKyAxLCBlLnIgKyAxLCBlLmMgKyAxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdvcmtib29rLnhsc3gud3JpdGVCdWZmZXIoKS50aGVuKGJ1ZmZlciA9PiB7XG4gICAgICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2J1ZmZlcl0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScgfSk7XG4gICAgICAgICAgICAvLyDlr7zlh7ogeGxzeFxuICAgICAgICAgICAgZG93bmxvYWRGaWxlKHBhcmFtcywgYmxvYiwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKG1zZ0tleSk7XG4gICAgICAgICAgICAgICAgbW9kYWwubWVzc2FnZSh7IGNvbnRlbnQ6IHQoJ3Z4ZS50YWJsZS5leHBTdWNjZXNzJyksIHN0YXR1czogJ3N1Y2Nlc3MnIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XG4gICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBpZDogbXNnS2V5LCBjb250ZW50OiB0KCd2eGUudGFibGUuZXhwTG9hZGluZycpLCBzdGF0dXM6ICdsb2FkaW5nJywgZHVyYXRpb246IC0xIH0pO1xuICAgICAgICBzZXRUaW1lb3V0KGV4cG9ydE1ldGhvZCwgMTUwMCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBleHBvcnRNZXRob2QoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkb3dubG9hZEZpbGUocGFyYW1zLCBibG9iLCBvcHRpb25zKSB7XG4gICAgY29uc3QgeyAkdGFibGUgfSA9IHBhcmFtcztcbiAgICBjb25zdCB7ICR2eGUgfSA9ICR0YWJsZTtcbiAgICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlO1xuICAgIGNvbnN0IHsgbWVzc2FnZSwgZmlsZW5hbWUsIHR5cGUgfSA9IG9wdGlvbnM7XG4gICAgY29uc3Qgc2hvd01zZyA9IG1lc3NhZ2UgIT09IGZhbHNlO1xuICAgIGlmICh3aW5kb3cuQmxvYikge1xuICAgICAgICBpZiAobmF2aWdhdG9yLm1zU2F2ZUJsb2IpIHtcbiAgICAgICAgICAgIG5hdmlnYXRvci5tc1NhdmVCbG9iKGJsb2IsIGAke2ZpbGVuYW1lfS4ke3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBsaW5rRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpbmtFbGVtLnRhcmdldCA9ICdfYmxhbmsnO1xuICAgICAgICAgICAgbGlua0VsZW0uZG93bmxvYWQgPSBgJHtmaWxlbmFtZX0uJHt0eXBlfWA7XG4gICAgICAgICAgICBsaW5rRWxlbS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGlua0VsZW0pO1xuICAgICAgICAgICAgbGlua0VsZW0uY2xpY2soKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGlua0VsZW0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xuICAgICAgICAgICAgbW9kYWwuYWxlcnQoeyBjb250ZW50OiB0KCd2eGUuZXJyb3Iubm90RXhwJyksIHN0YXR1czogJ2Vycm9yJyB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGNoZWNrSW1wb3J0RGF0YSh0YWJsZUZpZWxkcywgZmllbGRzKSB7XG4gICAgcmV0dXJuIGZpZWxkcy5zb21lKGZpZWxkID0+IHRhYmxlRmllbGRzLmluZGV4T2YoZmllbGQpID4gLTEpO1xufVxuZnVuY3Rpb24gaW1wb3J0RXJyb3IocGFyYW1zKSB7XG4gICAgY29uc3QgeyAkdGFibGUsIG9wdGlvbnMgfSA9IHBhcmFtcztcbiAgICBjb25zdCB7ICR2eGUsIF9pbXBvcnRSZWplY3QgfSA9ICR0YWJsZTtcbiAgICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZTtcbiAgICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlO1xuICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XG4gICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBjb250ZW50OiB0KCd2eGUuZXJyb3IuaW1wRmllbGRzJyksIHN0YXR1czogJ2Vycm9yJyB9KTtcbiAgICB9XG4gICAgaWYgKF9pbXBvcnRSZWplY3QpIHtcbiAgICAgICAgX2ltcG9ydFJlamVjdCh7IHN0YXR1czogZmFsc2UgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaW1wb3J0WExTWChwYXJhbXMpIHtcbiAgICBjb25zdCB7ICR0YWJsZSwgY29sdW1ucywgb3B0aW9ucywgZmlsZSB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IHsgJHZ4ZSwgX2ltcG9ydFJlc29sdmUgfSA9ICR0YWJsZTtcbiAgICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlO1xuICAgIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlO1xuICAgIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZpbGVSZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICB9O1xuICAgIGZpbGVSZWFkZXIub25sb2FkID0gKGV2bnQpID0+IHtcbiAgICAgICAgY29uc3QgdGFibGVGaWVsZHMgPSBbXTtcbiAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gY29sdW1uLnByb3BlcnR5O1xuICAgICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGFibGVGaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB3b3JrYm9vayA9IG5ldyBFeGNlbEpTLldvcmtib29rKCk7XG4gICAgICAgIGNvbnN0IHJlYWRlclRhcmdldCA9IGV2bnQudGFyZ2V0O1xuICAgICAgICBpZiAocmVhZGVyVGFyZ2V0KSB7XG4gICAgICAgICAgICB3b3JrYm9vay54bHN4LmxvYWQocmVhZGVyVGFyZ2V0LnJlc3VsdCkudGhlbih3YiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlyc3RTaGVldCA9IHdiLndvcmtzaGVldHNbMF07XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0U2hlZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2hlZXRWYWx1ZXMgPSBmaXJzdFNoZWV0LmdldFNoZWV0VmFsdWVzKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkSW5kZXggPSBYRVV0aWxzLmZpbmRJbmRleE9mKHNoZWV0VmFsdWVzLCAobGlzdCkgPT4gbGlzdCAmJiBsaXN0Lmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBzaGVldFZhbHVlc1tmaWVsZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gY2hlY2tJbXBvcnREYXRhKHRhYmxlRmllbGRzLCBmaWVsZHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWNvcmRzID0gc2hlZXRWYWx1ZXMuc2xpY2UoZmllbGRJbmRleCkubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0LmZvckVhY2goKGNlbGxWYWx1ZSwgY0luZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1bZmllbGRzW2NJbmRleF1dID0gY2VsbFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY29yZCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYmxlRmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvcmRbZmllbGRdID0gWEVVdGlscy5pc1VuZGVmaW5lZChpdGVtW2ZpZWxkXSkgPyBudWxsIDogaXRlbVtmaWVsZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhYmxlLmNyZWF0ZURhdGEocmVjb3JkcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsb2FkUmVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tb2RlID09PSAnaW5zZXJ0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkUmVzdCA9ICR0YWJsZS5pbnNlcnRBdChkYXRhLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkUmVzdCA9ICR0YWJsZS5yZWxvYWREYXRhKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbG9hZFJlc3QudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfaW1wb3J0UmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ltcG9ydFJlc29sdmUoeyBzdGF0dXM6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5tZXNzYWdlKHsgY29udGVudDogdCgndnhlLnRhYmxlLmltcFN1Y2Nlc3MnLCBbcmVjb3Jkcy5sZW5ndGhdKSwgc3RhdHVzOiAnc3VjY2VzcycgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbn1cbmZ1bmN0aW9uIGhhbmRsZUltcG9ydEV2ZW50KHBhcmFtcykge1xuICAgIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcbiAgICAgICAgaW1wb3J0WExTWChwYXJhbXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gaGFuZGxlRXhwb3J0RXZlbnQocGFyYW1zKSB7XG4gICAgaWYgKHBhcmFtcy5vcHRpb25zLnR5cGUgPT09ICd4bHN4Jykge1xuICAgICAgICBleHBvcnRYTFNYKHBhcmFtcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4vKipcbiAqIOWfuuS6jiB2eGUtdGFibGUg6KGo5qC855qE5aKe5by65o+S5Lu277yM5pSv5oyB5a+85Ye6IHhsc3gg5qC85byPXG4gKi9cbmV4cG9ydCBjb25zdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1ggPSB7XG4gICAgaW5zdGFsbCh2eGV0YWJsZSkge1xuICAgICAgICBjb25zdCB7IGludGVyY2VwdG9yIH0gPSB2eGV0YWJsZTtcbiAgICAgICAgdnhldGFibGUuc2V0dXAoe1xuICAgICAgICAgICAgZXhwb3J0OiB7XG4gICAgICAgICAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgeGxzeDogMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGludGVyY2VwdG9yLm1peGluKHtcbiAgICAgICAgICAgICdldmVudC5pbXBvcnQnOiBoYW5kbGVJbXBvcnRFdmVudCxcbiAgICAgICAgICAgICdldmVudC5leHBvcnQnOiBoYW5kbGVFeHBvcnRFdmVudFxuICAgICAgICB9KTtcbiAgICB9XG59O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSAmJiB3aW5kb3cuVlhFVGFibGUudXNlKSB7XG4gICAgd2luZG93LlZYRVRhYmxlLnVzZShWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1gpO1xufVxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYO1xuIl19
