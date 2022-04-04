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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIiwiaW5kZXguanMiXSwibmFtZXMiOlsiZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciIsImRlZmF1bHRDZWxsRm9udENvbG9yIiwiZGVmYXVsdENlbGxCb3JkZXJTdHlsZSIsImRlZmF1bHRDZWxsQm9yZGVyQ29sb3IiLCJnZXRDZWxsTGFiZWwiLCJjb2x1bW4iLCJjZWxsVmFsdWUiLCJjZWxsVHlwZSIsIlhFVXRpbHMiLCJ0b1ZhbHVlU3RyaW5nIiwiaXNOYU4iLCJOdW1iZXIiLCJsZW5ndGgiLCJnZXRGb290ZXJEYXRhIiwib3B0cyIsImZvb3RlckRhdGEiLCJmb290ZXJGaWx0ZXJNZXRob2QiLCJmaWx0ZXIiLCJpdGVtcyIsImluZGV4IiwiJHJvd0luZGV4IiwiZ2V0Rm9vdGVyQ2VsbFZhbHVlIiwiJHRhYmxlIiwicm93cyIsImdldFZNQ29sdW1uSW5kZXgiLCJnZXRWYWxpZENvbHVtbiIsImNoaWxkTm9kZXMiLCJpc0NvbEdyb3VwIiwic2V0RXhjZWxSb3dIZWlnaHQiLCJleGNlbFJvdyIsImhlaWdodCIsImZsb29yIiwic2V0RXhjZWxDZWxsU3R5bGUiLCJleGNlbENlbGwiLCJhbGlnbiIsInByb3RlY3Rpb24iLCJsb2NrZWQiLCJhbGlnbm1lbnQiLCJ2ZXJ0aWNhbCIsImhvcml6b250YWwiLCJnZXREZWZhdWx0Qm9yZGVyU3R5bGUiLCJ0b3AiLCJzdHlsZSIsImNvbG9yIiwiYXJnYiIsImxlZnQiLCJib3R0b20iLCJyaWdodCIsImV4cG9ydFhMU1giLCJwYXJhbXMiLCJtc2dLZXkiLCJvcHRpb25zIiwiY29sdW1ucyIsImNvbGdyb3VwcyIsImRhdGFzIiwiJHZ4ZSIsInJvd0hlaWdodCIsImFsbEhlYWRlckFsaWduIiwiaGVhZGVyQWxpZ24iLCJhbGxBbGlnbiIsImFsbEZvb3RlckFsaWduIiwiZm9vdGVyQWxpZ24iLCJtb2RhbCIsInQiLCJtZXNzYWdlIiwic2hlZXROYW1lIiwiaXNIZWFkZXIiLCJpc0Zvb3RlciIsImlzTWVyZ2UiLCJpc0NvbGdyb3VwIiwib3JpZ2luYWwiLCJ1c2VTdHlsZSIsInNoZWV0TWV0aG9kIiwic2hvd01zZyIsIm1lcmdlQ2VsbHMiLCJnZXRNZXJnZUNlbGxzIiwiY29sTGlzdCIsImZvb3RMaXN0Iiwic2hlZXRDb2xzIiwic2hlZXRNZXJnZXMiLCJiZWZvcmVSb3dDb3VudCIsImNvbEhlYWQiLCJmb3JFYWNoIiwiaWQiLCJwcm9wZXJ0eSIsInJlbmRlcldpZHRoIiwiZ2V0VGl0bGUiLCJwdXNoIiwia2V5Iiwid2lkdGgiLCJjZWlsIiwiY29scyIsInJJbmRleCIsImdyb3VwSGVhZCIsIl9jb2xTcGFuIiwiX3Jvd1NwYW4iLCJ2YWxpZENvbHVtbiIsImNvbHVtbkluZGV4IiwiaW5kZXhPZiIsInMiLCJyIiwiYyIsImUiLCJtZXJnZUl0ZW0iLCJtZXJnZVJvd0luZGV4Iiwicm93IiwibWVyZ2VSb3dzcGFuIiwicm93c3BhbiIsIm1lcmdlQ29sSW5kZXgiLCJjb2wiLCJtZXJnZUNvbHNwYW4iLCJjb2xzcGFuIiwicm93TGlzdCIsIm1hcCIsIml0ZW0iLCJyZXN0IiwiZ2V0VGFibGVEYXRhIiwiZm9vdGVycyIsIm1lcmdlRm9vdGVySXRlbXMiLCJnZXRNZXJnZUZvb3Rlckl0ZW1zIiwiZXhwb3J0TWV0aG9kIiwid29ya2Jvb2siLCJFeGNlbEpTIiwiV29ya2Jvb2siLCJzaGVldCIsImFkZFdvcmtzaGVldCIsImNyZWF0b3IiLCJhZGRSb3dzIiwiZWFjaENlbGwiLCJleGNlbENvbCIsImdldENvbHVtbiIsImdldENvbHVtbkJ5SWQiLCJPYmplY3QiLCJhc3NpZ24iLCJmb250IiwibmFtZSIsImJvbGQiLCJzaXplIiwiZmlsbCIsInR5cGUiLCJwYXR0ZXJuIiwiZmdDb2xvciIsImJvcmRlciIsInNQYXJhbXMiLCJ3b3Jrc2hlZXQiLCJ4bHN4Iiwid3JpdGVCdWZmZXIiLCJ0aGVuIiwiYnVmZmVyIiwiYmxvYiIsIkJsb2IiLCJkb3dubG9hZEZpbGUiLCJjbG9zZSIsImNvbnRlbnQiLCJzdGF0dXMiLCJkdXJhdGlvbiIsInNldFRpbWVvdXQiLCJmaWxlbmFtZSIsIndpbmRvdyIsIm5hdmlnYXRvciIsIm1zU2F2ZUJsb2IiLCJsaW5rRWxlbSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInRhcmdldCIsImRvd25sb2FkIiwiaHJlZiIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJhbGVydCIsImNoZWNrSW1wb3J0RGF0YSIsInRhYmxlRmllbGRzIiwiZmllbGRzIiwic29tZSIsImZpZWxkIiwiaW1wb3J0RXJyb3IiLCJfaW1wb3J0UmVqZWN0IiwiaW1wb3J0WExTWCIsImZpbGUiLCJfaW1wb3J0UmVzb2x2ZSIsImZpbGVSZWFkZXIiLCJGaWxlUmVhZGVyIiwib25lcnJvciIsIm9ubG9hZCIsImV2bnQiLCJyZWFkZXJUYXJnZXQiLCJsb2FkIiwicmVzdWx0Iiwid2IiLCJmaXJzdFNoZWV0Iiwid29ya3NoZWV0cyIsInNoZWV0VmFsdWVzIiwiZ2V0U2hlZXRWYWx1ZXMiLCJmaWVsZEluZGV4IiwiZmluZEluZGV4T2YiLCJsaXN0IiwicmVjb3JkcyIsInNsaWNlIiwiY0luZGV4IiwicmVjb3JkIiwiaXNVbmRlZmluZWQiLCJjcmVhdGVEYXRhIiwiZGF0YSIsImxvYWRSZXN0IiwibW9kZSIsImluc2VydEF0IiwicmVsb2FkRGF0YSIsInJlYWRBc0FycmF5QnVmZmVyIiwiaGFuZGxlSW1wb3J0RXZlbnQiLCJoYW5kbGVFeHBvcnRFdmVudCIsIlZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWCIsImluc3RhbGwiLCJ2eGV0YWJsZSIsImludGVyY2VwdG9yIiwic2V0dXAiLCJ0eXBlcyIsIm1peGluIiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQVVBOzs7Ozs7OztBQUVBLElBQU1BLDRCQUE0QixHQUFHLFFBQXJDO0FBQ0EsSUFBTUMsb0JBQW9CLEdBQUcsUUFBN0I7QUFDQSxJQUFNQyxzQkFBc0IsR0FB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QUF3QixHQUFHO0FBQ3RDQyxFQUFBQSxPQURzQyxtQkFDN0JDLFFBRDZCLEVBQ0o7QUFDaEMsUUFBUUMsV0FBUixHQUF3QkQsUUFBeEIsQ0FBUUMsV0FBUjtBQUNBRCxJQUFBQSxRQUFRLENBQUNFLEtBQVQsQ0FBZTtBQUNiLGdCQUFRO0FBQ05DLFFBQUFBLEtBQUssRUFBRTtBQUNMMUUsVUFBQUEsSUFBSSxFQUFFO0FBREQ7QUFERDtBQURLLEtBQWY7QUFPQXdFLElBQUFBLFdBQVcsQ0FBQ0csS0FBWixDQUFrQjtBQUNoQixzQkFBZ0JSLGlCQURBO0FBRWhCLHNCQUFnQkM7QUFGQSxLQUFsQjtBQUlEO0FBZHFDLENBQWpDOzs7QUFpQlAsSUFBSSxPQUFPdkQsTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsTUFBTSxDQUFDK0QsUUFBeEMsSUFBb0QvRCxNQUFNLENBQUMrRCxRQUFQLENBQWdCQyxHQUF4RSxFQUE2RTtBQUMzRWhFLEVBQUFBLE1BQU0sQ0FBQytELFFBQVAsQ0FBZ0JDLEdBQWhCLENBQW9CUix3QkFBcEI7QUFDRDs7ZUFFY0Esd0IiLCJmaWxlIjoiaW5kZXguY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMnXHJcbmltcG9ydCB7XHJcbiAgVlhFVGFibGUsXHJcbiAgVGFibGUsXHJcbiAgSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsXHJcbiAgSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMsXHJcbiAgQ29sdW1uQ29uZmlnLFxyXG4gIFRhYmxlRXhwb3J0Q29uZmlnLFxyXG4gIENvbHVtbkFsaWduXHJcbn0gZnJvbSAndnhlLXRhYmxlJ1xyXG5pbXBvcnQgKiBhcyBFeGNlbEpTIGZyb20gJ2V4Y2VsanMnXHJcblxyXG5jb25zdCBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yID0gJ2Y4ZjhmOSdcclxuY29uc3QgZGVmYXVsdENlbGxGb250Q29sb3IgPSAnNjA2MjY2J1xyXG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlID0gJ3RoaW4nXHJcbmNvbnN0IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3IgPSAnZThlYWVjJ1xyXG5cclxuZnVuY3Rpb24gZ2V0Q2VsbExhYmVsIChjb2x1bW46IENvbHVtbkNvbmZpZywgY2VsbFZhbHVlOiBhbnkpIHtcclxuICBpZiAoY2VsbFZhbHVlKSB7XHJcbiAgICBzd2l0Y2ggKGNvbHVtbi5jZWxsVHlwZSkge1xyXG4gICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgIHJldHVybiBYRVV0aWxzLnRvVmFsdWVTdHJpbmcoY2VsbFZhbHVlKVxyXG4gICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgIGlmICghaXNOYU4oY2VsbFZhbHVlKSkge1xyXG4gICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgaWYgKGNlbGxWYWx1ZS5sZW5ndGggPCAxMiAmJiAhaXNOYU4oY2VsbFZhbHVlKSkge1xyXG4gICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjZWxsVmFsdWVcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Rm9vdGVyRGF0YSAob3B0czogVGFibGVFeHBvcnRDb25maWcsIGZvb3RlckRhdGE6IGFueVtdW10pIHtcclxuICBjb25zdCB7IGZvb3RlckZpbHRlck1ldGhvZCB9ID0gb3B0c1xyXG4gIHJldHVybiBmb290ZXJGaWx0ZXJNZXRob2QgPyBmb290ZXJEYXRhLmZpbHRlcigoaXRlbXMsIGluZGV4KSA9PiBmb290ZXJGaWx0ZXJNZXRob2QoeyBpdGVtcywgJHJvd0luZGV4OiBpbmRleCB9KSkgOiBmb290ZXJEYXRhXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEZvb3RlckNlbGxWYWx1ZSAoJHRhYmxlOiBUYWJsZSwgb3B0czogVGFibGVFeHBvcnRDb25maWcsIHJvd3M6IGFueVtdLCBjb2x1bW46IENvbHVtbkNvbmZpZykge1xyXG4gIGNvbnN0IGNlbGxWYWx1ZSA9IGdldENlbGxMYWJlbChjb2x1bW4sIHJvd3NbJHRhYmxlLmdldFZNQ29sdW1uSW5kZXgoY29sdW1uKV0pXHJcbiAgcmV0dXJuIGNlbGxWYWx1ZVxyXG59XHJcblxyXG5kZWNsYXJlIG1vZHVsZSAndnhlLXRhYmxlJyB7XHJcbiAgaW50ZXJmYWNlIENvbHVtbkluZm8ge1xyXG4gICAgX3JvdzogYW55O1xyXG4gICAgX2NvbFNwYW46IG51bWJlcjtcclxuICAgIF9yb3dTcGFuOiBudW1iZXI7XHJcbiAgICBjaGlsZE5vZGVzOiBDb2x1bW5Db25maWdbXTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFZhbGlkQ29sdW1uIChjb2x1bW46IENvbHVtbkNvbmZpZyk6IENvbHVtbkNvbmZpZyB7XHJcbiAgY29uc3QgeyBjaGlsZE5vZGVzIH0gPSBjb2x1bW5cclxuICBjb25zdCBpc0NvbEdyb3VwID0gY2hpbGROb2RlcyAmJiBjaGlsZE5vZGVzLmxlbmd0aFxyXG4gIGlmIChpc0NvbEdyb3VwKSB7XHJcbiAgICByZXR1cm4gZ2V0VmFsaWRDb2x1bW4oY2hpbGROb2Rlc1swXSlcclxuICB9XHJcbiAgcmV0dXJuIGNvbHVtblxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFeGNlbFJvd0hlaWdodCAoZXhjZWxSb3c6IEV4Y2VsSlMuUm93LCBoZWlnaHQ6IG51bWJlcikge1xyXG4gIGlmIChoZWlnaHQpIHtcclxuICAgIGV4Y2VsUm93LmhlaWdodCA9IFhFVXRpbHMuZmxvb3IoaGVpZ2h0ICogMC43NSwgMTIpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFeGNlbENlbGxTdHlsZSAoZXhjZWxDZWxsOiBFeGNlbEpTLkNlbGwsIGFsaWduPzogQ29sdW1uQWxpZ24pIHtcclxuICBleGNlbENlbGwucHJvdGVjdGlvbiA9IHtcclxuICAgIGxvY2tlZDogZmFsc2VcclxuICB9XHJcbiAgZXhjZWxDZWxsLmFsaWdubWVudCA9IHtcclxuICAgIHZlcnRpY2FsOiAnbWlkZGxlJyxcclxuICAgIGhvcml6b250YWw6IGFsaWduIHx8ICdsZWZ0J1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJvcmRlclN0eWxlICgpIHtcclxuICByZXR1cm4ge1xyXG4gICAgdG9wOiB7XHJcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxyXG4gICAgICBjb2xvcjoge1xyXG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxlZnQ6IHtcclxuICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXHJcbiAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYm90dG9tOiB7XHJcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxyXG4gICAgICBjb2xvcjoge1xyXG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJpZ2h0OiB7XHJcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxyXG4gICAgICBjb2xvcjoge1xyXG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXhwb3J0WExTWCAocGFyYW1zOiBJbnRlcmNlcHRvckV4cG9ydFBhcmFtcykge1xyXG4gIGNvbnN0IG1zZ0tleSA9ICd4bHN4J1xyXG4gIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zLCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzIH0gPSBwYXJhbXNcclxuICBjb25zdCB7ICR2eGUsIHJvd0hlaWdodCwgaGVhZGVyQWxpZ246IGFsbEhlYWRlckFsaWduLCBhbGlnbjogYWxsQWxpZ24sIGZvb3RlckFsaWduOiBhbGxGb290ZXJBbGlnbiB9ID0gJHRhYmxlXHJcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxyXG4gIGNvbnN0IHsgbWVzc2FnZSwgc2hlZXROYW1lLCBpc0hlYWRlciwgaXNGb290ZXIsIGlzTWVyZ2UsIGlzQ29sZ3JvdXAsIG9yaWdpbmFsLCB1c2VTdHlsZSwgc2hlZXRNZXRob2QgfSA9IG9wdGlvbnNcclxuICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2VcclxuICBjb25zdCBtZXJnZUNlbGxzID0gJHRhYmxlLmdldE1lcmdlQ2VsbHMoKVxyXG4gIGNvbnN0IGNvbExpc3Q6IGFueVtdID0gW11cclxuICBjb25zdCBmb290TGlzdDogYW55W10gPSBbXVxyXG4gIGNvbnN0IHNoZWV0Q29sczogYW55W10gPSBbXVxyXG4gIGNvbnN0IHNoZWV0TWVyZ2VzOiB7IHM6IHsgcjogbnVtYmVyLCBjOiBudW1iZXIgfSwgZTogeyByOiBudW1iZXIsIGM6IG51bWJlciB9IH1bXSA9IFtdXHJcbiAgbGV0IGJlZm9yZVJvd0NvdW50ID0gMFxyXG4gIGNvbnN0IGNvbEhlYWQ6IGFueSA9IHt9XHJcbiAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgIGNvbnN0IHsgaWQsIHByb3BlcnR5LCByZW5kZXJXaWR0aCB9ID0gY29sdW1uXHJcbiAgICBjb2xIZWFkW2lkXSA9IG9yaWdpbmFsID8gcHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKVxyXG4gICAgc2hlZXRDb2xzLnB1c2goe1xyXG4gICAgICBrZXk6IGlkLFxyXG4gICAgICB3aWR0aDogWEVVdGlscy5jZWlsKHJlbmRlcldpZHRoIC8gOCwgMSlcclxuICAgIH0pXHJcbiAgfSlcclxuICAvLyDlpITnkIbooajlpLRcclxuICBpZiAoaXNIZWFkZXIpIHtcclxuICAgIC8vIOWkhOeQhuWIhue7hFxyXG4gICAgaWYgKGlzQ29sZ3JvdXAgJiYgIW9yaWdpbmFsICYmIGNvbGdyb3Vwcykge1xyXG4gICAgICBjb2xncm91cHMuZm9yRWFjaCgoY29scywgckluZGV4KSA9PiB7XHJcbiAgICAgICAgY29uc3QgZ3JvdXBIZWFkOiBhbnkgPSB7fVxyXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XHJcbiAgICAgICAgICBncm91cEhlYWRbY29sdW1uLmlkXSA9IG51bGxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbHMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB7IF9jb2xTcGFuLCBfcm93U3BhbiB9ID0gY29sdW1uXHJcbiAgICAgICAgICBjb25zdCB2YWxpZENvbHVtbiA9IGdldFZhbGlkQ29sdW1uKGNvbHVtbilcclxuICAgICAgICAgIGNvbnN0IGNvbHVtbkluZGV4ID0gY29sdW1ucy5pbmRleE9mKHZhbGlkQ29sdW1uKVxyXG4gICAgICAgICAgZ3JvdXBIZWFkW3ZhbGlkQ29sdW1uLmlkXSA9IG9yaWdpbmFsID8gdmFsaWRDb2x1bW4ucHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKVxyXG4gICAgICAgICAgaWYgKF9jb2xTcGFuID4gMSB8fCBfcm93U3BhbiA+IDEpIHtcclxuICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgczogeyByOiBySW5kZXgsIGM6IGNvbHVtbkluZGV4IH0sXHJcbiAgICAgICAgICAgICAgZTogeyByOiBySW5kZXggKyBfcm93U3BhbiAtIDEsIGM6IGNvbHVtbkluZGV4ICsgX2NvbFNwYW4gLSAxIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbExpc3QucHVzaChncm91cEhlYWQpXHJcbiAgICAgIH0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb2xMaXN0LnB1c2goY29sSGVhZClcclxuICAgIH1cclxuICAgIGJlZm9yZVJvd0NvdW50ICs9IGNvbExpc3QubGVuZ3RoXHJcbiAgfVxyXG4gIC8vIOWkhOeQhuWQiOW5tlxyXG4gIGlmIChpc01lcmdlICYmICFvcmlnaW5hbCkge1xyXG4gICAgbWVyZ2VDZWxscy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IHsgcm93OiBtZXJnZVJvd0luZGV4LCByb3dzcGFuOiBtZXJnZVJvd3NwYW4sIGNvbDogbWVyZ2VDb2xJbmRleCwgY29sc3BhbjogbWVyZ2VDb2xzcGFuIH0gPSBtZXJnZUl0ZW1cclxuICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XHJcbiAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcclxuICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgfVxyXG4gIGNvbnN0IHJvd0xpc3QgPSBkYXRhcy5tYXAoaXRlbSA9PiB7XHJcbiAgICBjb25zdCByZXN0OiBhbnkgPSB7fVxyXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgcmVzdFtjb2x1bW4uaWRdID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgaXRlbVtjb2x1bW4uaWRdKVxyXG4gICAgfSlcclxuICAgIHJldHVybiByZXN0XHJcbiAgfSlcclxuICBiZWZvcmVSb3dDb3VudCArPSByb3dMaXN0Lmxlbmd0aFxyXG4gIC8vIOWkhOeQhuihqOWwvlxyXG4gIGlmIChpc0Zvb3Rlcikge1xyXG4gICAgY29uc3QgeyBmb290ZXJEYXRhIH0gPSAkdGFibGUuZ2V0VGFibGVEYXRhKClcclxuICAgIGNvbnN0IGZvb3RlcnMgPSBnZXRGb290ZXJEYXRhKG9wdGlvbnMsIGZvb3RlckRhdGEpXHJcbiAgICBjb25zdCBtZXJnZUZvb3Rlckl0ZW1zID0gJHRhYmxlLmdldE1lcmdlRm9vdGVySXRlbXMoKVxyXG4gICAgLy8g5aSE55CG5ZCI5bm2XHJcbiAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcclxuICAgICAgbWVyZ2VGb290ZXJJdGVtcy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XHJcbiAgICAgICAgY29uc3QgeyByb3c6IG1lcmdlUm93SW5kZXgsIHJvd3NwYW46IG1lcmdlUm93c3BhbiwgY29sOiBtZXJnZUNvbEluZGV4LCBjb2xzcGFuOiBtZXJnZUNvbHNwYW4gfSA9IG1lcmdlSXRlbVxyXG4gICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xyXG4gICAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcclxuICAgICAgICAgIGU6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50ICsgbWVyZ2VSb3dzcGFuIC0gMSwgYzogbWVyZ2VDb2xJbmRleCArIG1lcmdlQ29sc3BhbiAtIDEgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBmb290ZXJzLmZvckVhY2goKHJvd3MpID0+IHtcclxuICAgICAgY29uc3QgaXRlbTogYW55ID0ge31cclxuICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgICBpdGVtW2NvbHVtbi5pZF0gPSBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRpb25zLCByb3dzLCBjb2x1bW4pXHJcbiAgICAgIH0pXHJcbiAgICAgIGZvb3RMaXN0LnB1c2goaXRlbSlcclxuICAgIH0pXHJcbiAgfVxyXG4gIGNvbnN0IGV4cG9ydE1ldGhvZCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxyXG4gICAgY29uc3Qgc2hlZXQgPSB3b3JrYm9vay5hZGRXb3Jrc2hlZXQoc2hlZXROYW1lKVxyXG4gICAgd29ya2Jvb2suY3JlYXRvciA9ICd2eGUtdGFibGUnXHJcbiAgICBzaGVldC5jb2x1bW5zID0gc2hlZXRDb2xzXHJcbiAgICBpZiAoaXNIZWFkZXIpIHtcclxuICAgICAgc2hlZXQuYWRkUm93cyhjb2xMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcclxuICAgICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XHJcbiAgICAgICAgICBjb25zdCBleGNlbENvbCA9IHNoZWV0LmdldENvbHVtbihleGNlbENlbGwuY29sKVxyXG4gICAgICAgICAgY29uc3QgY29sdW1uOiBhbnkgPSAkdGFibGUuZ2V0Q29sdW1uQnlJZChleGNlbENvbC5rZXkgYXMgc3RyaW5nKVxyXG4gICAgICAgICAgY29uc3QgeyBoZWFkZXJBbGlnbiwgYWxpZ24gfSA9IGNvbHVtblxyXG4gICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBoZWFkZXJBbGlnbiB8fCBhbGlnbiB8fCBhbGxIZWFkZXJBbGlnbiB8fCBhbGxBbGlnbilcclxuICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xyXG4gICAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXHJcbiAgICAgICAgICAgICAgICBib2xkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogOFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZmlsbDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BhdHRlcm4nLFxyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogJ3NvbGlkJyxcclxuICAgICAgICAgICAgICAgIGZnQ29sb3I6IHtcclxuICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvclxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzaGVldC5hZGRSb3dzKHJvd0xpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xyXG4gICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KVxyXG4gICAgICB9XHJcbiAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XHJcbiAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbClcclxuICAgICAgICBjb25zdCBjb2x1bW46IGFueSA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSBhcyBzdHJpbmcpXHJcbiAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uXHJcbiAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBhbGlnbiB8fCBhbGxBbGlnbilcclxuICAgICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XHJcbiAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgICAgICAgICAgIHNpemU6IDgsXHJcbiAgICAgICAgICAgICAgY29sb3I6IHtcclxuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBpZiAoaXNGb290ZXIpIHtcclxuICAgICAgc2hlZXQuYWRkUm93cyhmb290TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XHJcbiAgICAgICAgaWYgKHVzZVN0eWxlKSB7XHJcbiAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbClcclxuICAgICAgICAgIGNvbnN0IGNvbHVtbjogYW55ID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5IGFzIHN0cmluZylcclxuICAgICAgICAgIGNvbnN0IHsgZm9vdGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW5cclxuICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgZm9vdGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsRm9vdGVyQWxpZ24gfHwgYWxsQWxpZ24pXHJcbiAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcclxuICAgICAgICAgICAgICBmb250OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogOCxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGlmICh1c2VTdHlsZSAmJiBzaGVldE1ldGhvZCkge1xyXG4gICAgICBjb25zdCBzUGFyYW1zID0geyBvcHRpb25zOiBvcHRpb25zIGFzIGFueSwgd29ya2Jvb2ssIHdvcmtzaGVldDogc2hlZXQsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMsICR0YWJsZSB9XHJcbiAgICAgIHNoZWV0TWV0aG9kKHNQYXJhbXMpXHJcbiAgICB9XHJcbiAgICBzaGVldE1lcmdlcy5mb3JFYWNoKCh7IHMsIGUgfSkgPT4ge1xyXG4gICAgICBzaGVldC5tZXJnZUNlbGxzKHMuciArIDEsIHMuYyArIDEsIGUuciArIDEsIGUuYyArIDEpXHJcbiAgICB9KVxyXG4gICAgd29ya2Jvb2sueGxzeC53cml0ZUJ1ZmZlcigpLnRoZW4oYnVmZmVyID0+IHtcclxuICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nIH0pXHJcbiAgICAgIC8vIOWvvOWHuiB4bHN4XHJcbiAgICAgIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpXHJcbiAgICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XHJcbiAgICAgICAgbW9kYWwuY2xvc2UobXNnS2V5KVxyXG4gICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBjb250ZW50OiB0KCd2eGUudGFibGUuZXhwU3VjY2VzcycpIGFzIHN0cmluZywgc3RhdHVzOiAnc3VjY2VzcycgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcclxuICAgIG1vZGFsLm1lc3NhZ2UoeyBpZDogbXNnS2V5LCBjb250ZW50OiB0KCd2eGUudGFibGUuZXhwTG9hZGluZycpIGFzIHN0cmluZywgc3RhdHVzOiAnbG9hZGluZycsIGR1cmF0aW9uOiAtMSB9KVxyXG4gICAgc2V0VGltZW91dChleHBvcnRNZXRob2QsIDE1MDApXHJcbiAgfSBlbHNlIHtcclxuICAgIGV4cG9ydE1ldGhvZCgpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkb3dubG9hZEZpbGUgKHBhcmFtczogSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsIGJsb2I6IEJsb2IsIG9wdGlvbnM6IFRhYmxlRXhwb3J0Q29uZmlnKSB7XHJcbiAgY29uc3QgeyAkdGFibGUgfSA9IHBhcmFtc1xyXG4gIGNvbnN0IHsgJHZ4ZSB9ID0gJHRhYmxlXHJcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxyXG4gIGNvbnN0IHsgbWVzc2FnZSwgZmlsZW5hbWUsIHR5cGUgfSA9IG9wdGlvbnNcclxuICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2VcclxuICBpZiAod2luZG93LkJsb2IpIHtcclxuICAgIGlmICgobmF2aWdhdG9yIGFzIGFueSkubXNTYXZlQmxvYikge1xyXG4gICAgICAobmF2aWdhdG9yIGFzIGFueSkubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBsaW5rRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxyXG4gICAgICBsaW5rRWxlbS50YXJnZXQgPSAnX2JsYW5rJ1xyXG4gICAgICBsaW5rRWxlbS5kb3dubG9hZCA9IGAke2ZpbGVuYW1lfS4ke3R5cGV9YFxyXG4gICAgICBsaW5rRWxlbS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKVxyXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmtFbGVtKVxyXG4gICAgICBsaW5rRWxlbS5jbGljaygpXHJcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGlua0VsZW0pXHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XHJcbiAgICAgIG1vZGFsLmFsZXJ0KHsgY29udGVudDogdCgndnhlLmVycm9yLm5vdEV4cCcpIGFzIHN0cmluZywgc3RhdHVzOiAnZXJyb3InIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0ltcG9ydERhdGEgKHRhYmxlRmllbGRzOiBzdHJpbmdbXSwgZmllbGRzOiBzdHJpbmdbXSkge1xyXG4gIHJldHVybiBmaWVsZHMuc29tZShmaWVsZCA9PiB0YWJsZUZpZWxkcy5pbmRleE9mKGZpZWxkKSA+IC0xKVxyXG59XHJcblxyXG5kZWNsYXJlIG1vZHVsZSAndnhlLXRhYmxlJyB7XHJcbiAgaW50ZXJmYWNlIFRhYmxlIHtcclxuICAgIF9pbXBvcnRSZXNvbHZlPzogRnVuY3Rpb24gfCBudWxsO1xyXG4gICAgX2ltcG9ydFJlamVjdD86IEZ1bmN0aW9uIHwgbnVsbDtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gaW1wb3J0RXJyb3IgKHBhcmFtczogSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMpIHtcclxuICBjb25zdCB7ICR0YWJsZSwgb3B0aW9ucyB9ID0gcGFyYW1zXHJcbiAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVqZWN0IH0gPSAkdGFibGVcclxuICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZVxyXG4gIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGVcclxuICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xyXG4gICAgbW9kYWwubWVzc2FnZSh7IGNvbnRlbnQ6IHQoJ3Z4ZS5lcnJvci5pbXBGaWVsZHMnKSBhcyBzdHJpbmcsIHN0YXR1czogJ2Vycm9yJyB9KVxyXG4gIH1cclxuICBpZiAoX2ltcG9ydFJlamVjdCkge1xyXG4gICAgX2ltcG9ydFJlamVjdCh7IHN0YXR1czogZmFsc2UgfSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGltcG9ydFhMU1ggKHBhcmFtczogSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMpIHtcclxuICBjb25zdCB7ICR0YWJsZSwgY29sdW1ucywgb3B0aW9ucywgZmlsZSB9ID0gcGFyYW1zXHJcbiAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVzb2x2ZSB9ID0gJHRhYmxlXHJcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxyXG4gIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlXHJcbiAgY29uc3QgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcclxuICBmaWxlUmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICBpbXBvcnRFcnJvcihwYXJhbXMpXHJcbiAgfVxyXG4gIGZpbGVSZWFkZXIub25sb2FkID0gKGV2bnQpID0+IHtcclxuICAgIGNvbnN0IHRhYmxlRmllbGRzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgICBjb25zdCBmaWVsZCA9IGNvbHVtbi5wcm9wZXJ0eVxyXG4gICAgICBpZiAoZmllbGQpIHtcclxuICAgICAgICB0YWJsZUZpZWxkcy5wdXNoKGZpZWxkKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpXHJcbiAgICBjb25zdCByZWFkZXJUYXJnZXQgPSBldm50LnRhcmdldFxyXG4gICAgaWYgKHJlYWRlclRhcmdldCkge1xyXG4gICAgICB3b3JrYm9vay54bHN4LmxvYWQocmVhZGVyVGFyZ2V0LnJlc3VsdCBhcyBBcnJheUJ1ZmZlcikudGhlbih3YiA9PiB7XHJcbiAgICAgICAgY29uc3QgZmlyc3RTaGVldCA9IHdiLndvcmtzaGVldHNbMF1cclxuICAgICAgICBpZiAoZmlyc3RTaGVldCkge1xyXG4gICAgICAgICAgY29uc3Qgc2hlZXRWYWx1ZXMgPSBmaXJzdFNoZWV0LmdldFNoZWV0VmFsdWVzKCkgYXMgc3RyaW5nW11bXVxyXG4gICAgICAgICAgY29uc3QgZmllbGRJbmRleCA9IFhFVXRpbHMuZmluZEluZGV4T2Yoc2hlZXRWYWx1ZXMsIChsaXN0KSA9PiBsaXN0ICYmIGxpc3QubGVuZ3RoID4gMClcclxuICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IHNoZWV0VmFsdWVzW2ZpZWxkSW5kZXhdIGFzIHN0cmluZ1tdXHJcbiAgICAgICAgICBjb25zdCBzdGF0dXMgPSBjaGVja0ltcG9ydERhdGEodGFibGVGaWVsZHMsIGZpZWxkcylcclxuICAgICAgICAgIGlmIChzdGF0dXMpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IHNoZWV0VmFsdWVzLnNsaWNlKGZpZWxkSW5kZXgpLm1hcChsaXN0ID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBpdGVtIDogYW55ID0ge31cclxuICAgICAgICAgICAgICBsaXN0LmZvckVhY2goKGNlbGxWYWx1ZSwgY0luZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpdGVtW2ZpZWxkc1tjSW5kZXhdXSA9IGNlbGxWYWx1ZVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgY29uc3QgcmVjb3JkOiBhbnkgPSB7fVxyXG4gICAgICAgICAgICAgIHRhYmxlRmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVjb3JkW2ZpZWxkXSA9IFhFVXRpbHMuaXNVbmRlZmluZWQoaXRlbVtmaWVsZF0pID8gbnVsbCA6IGl0ZW1bZmllbGRdXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICR0YWJsZS5jcmVhdGVEYXRhKHJlY29yZHMpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKGRhdGE6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbG9hZFJlc3Q6IFByb21pc2U8YW55PlxyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2luc2VydCcpIHtcclxuICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUuaW5zZXJ0QXQoZGF0YSwgLTEpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBsb2FkUmVzdCA9ICR0YWJsZS5yZWxvYWREYXRhKGRhdGEpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9hZFJlc3QudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChfaW1wb3J0UmVzb2x2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9pbXBvcnRSZXNvbHZlKHsgc3RhdHVzOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcclxuICAgICAgICAgICAgICBtb2RhbC5tZXNzYWdlKHsgY29udGVudDogdCgndnhlLnRhYmxlLmltcFN1Y2Nlc3MnLCBbcmVjb3Jkcy5sZW5ndGhdKSBhcyBzdHJpbmcsIHN0YXR1czogJ3N1Y2Nlc3MnIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcclxuICAgIH1cclxuICB9XHJcbiAgZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKVxyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVJbXBvcnRFdmVudCAocGFyYW1zOiBJbnRlcmNlcHRvckltcG9ydFBhcmFtcykge1xyXG4gIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcclxuICAgIGltcG9ydFhMU1gocGFyYW1zKVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVFeHBvcnRFdmVudCAocGFyYW1zOiBJbnRlcmNlcHRvckV4cG9ydFBhcmFtcykge1xyXG4gIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcclxuICAgIGV4cG9ydFhMU1gocGFyYW1zKVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICog5Z+65LqOIHZ4ZS10YWJsZSDooajmoLznmoTlop7lvLrmj5Lku7bvvIzmlK/mjIHlr7zlh7ogeGxzeCDmoLzlvI9cclxuICovXHJcbmV4cG9ydCBjb25zdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1ggPSB7XHJcbiAgaW5zdGFsbCAodnhldGFibGU6IHR5cGVvZiBWWEVUYWJsZSkge1xyXG4gICAgY29uc3QgeyBpbnRlcmNlcHRvciB9ID0gdnhldGFibGVcclxuICAgIHZ4ZXRhYmxlLnNldHVwKHtcclxuICAgICAgZXhwb3J0OiB7XHJcbiAgICAgICAgdHlwZXM6IHtcclxuICAgICAgICAgIHhsc3g6IDBcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICBpbnRlcmNlcHRvci5taXhpbih7XHJcbiAgICAgICdldmVudC5pbXBvcnQnOiBoYW5kbGVJbXBvcnRFdmVudCxcclxuICAgICAgJ2V2ZW50LmV4cG9ydCc6IGhhbmRsZUV4cG9ydEV2ZW50XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSAmJiB3aW5kb3cuVlhFVGFibGUudXNlKSB7XHJcbiAgd2luZG93LlZYRVRhYmxlLnVzZShWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1gpXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWFxyXG4iLCJpbXBvcnQgWEVVdGlscyBmcm9tICd4ZS11dGlscyc7XG5pbXBvcnQgKiBhcyBFeGNlbEpTIGZyb20gJ2V4Y2VsanMnO1xuY29uc3QgZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciA9ICdmOGY4ZjknO1xuY29uc3QgZGVmYXVsdENlbGxGb250Q29sb3IgPSAnNjA2MjY2JztcbmNvbnN0IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUgPSAndGhpbic7XG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yID0gJ2U4ZWFlYyc7XG5mdW5jdGlvbiBnZXRDZWxsTGFiZWwoY29sdW1uLCBjZWxsVmFsdWUpIHtcbiAgICBpZiAoY2VsbFZhbHVlKSB7XG4gICAgICAgIHN3aXRjaCAoY29sdW1uLmNlbGxUeXBlKSB7XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgIHJldHVybiBYRVV0aWxzLnRvVmFsdWVTdHJpbmcoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChjZWxsVmFsdWUubGVuZ3RoIDwgMTIgJiYgIWlzTmFOKGNlbGxWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2VsbFZhbHVlO1xufVxuZnVuY3Rpb24gZ2V0Rm9vdGVyRGF0YShvcHRzLCBmb290ZXJEYXRhKSB7XG4gICAgY29uc3QgeyBmb290ZXJGaWx0ZXJNZXRob2QgfSA9IG9wdHM7XG4gICAgcmV0dXJuIGZvb3RlckZpbHRlck1ldGhvZCA/IGZvb3RlckRhdGEuZmlsdGVyKChpdGVtcywgaW5kZXgpID0+IGZvb3RlckZpbHRlck1ldGhvZCh7IGl0ZW1zLCAkcm93SW5kZXg6IGluZGV4IH0pKSA6IGZvb3RlckRhdGE7XG59XG5mdW5jdGlvbiBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRzLCByb3dzLCBjb2x1bW4pIHtcbiAgICBjb25zdCBjZWxsVmFsdWUgPSBnZXRDZWxsTGFiZWwoY29sdW1uLCByb3dzWyR0YWJsZS5nZXRWTUNvbHVtbkluZGV4KGNvbHVtbildKTtcbiAgICByZXR1cm4gY2VsbFZhbHVlO1xufVxuZnVuY3Rpb24gZ2V0VmFsaWRDb2x1bW4oY29sdW1uKSB7XG4gICAgY29uc3QgeyBjaGlsZE5vZGVzIH0gPSBjb2x1bW47XG4gICAgY29uc3QgaXNDb2xHcm91cCA9IGNoaWxkTm9kZXMgJiYgY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgaWYgKGlzQ29sR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIGdldFZhbGlkQ29sdW1uKGNoaWxkTm9kZXNbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sdW1uO1xufVxuZnVuY3Rpb24gc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIGhlaWdodCkge1xuICAgIGlmIChoZWlnaHQpIHtcbiAgICAgICAgZXhjZWxSb3cuaGVpZ2h0ID0gWEVVdGlscy5mbG9vcihoZWlnaHQgKiAwLjc1LCAxMik7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBhbGlnbikge1xuICAgIGV4Y2VsQ2VsbC5wcm90ZWN0aW9uID0ge1xuICAgICAgICBsb2NrZWQ6IGZhbHNlXG4gICAgfTtcbiAgICBleGNlbENlbGwuYWxpZ25tZW50ID0ge1xuICAgICAgICB2ZXJ0aWNhbDogJ21pZGRsZScsXG4gICAgICAgIGhvcml6b250YWw6IGFsaWduIHx8ICdsZWZ0J1xuICAgIH07XG59XG5mdW5jdGlvbiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdG9wOiB7XG4gICAgICAgICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBib3R0b206IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJpZ2h0OiB7XG4gICAgICAgICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGV4cG9ydFhMU1gocGFyYW1zKSB7XG4gICAgY29uc3QgbXNnS2V5ID0gJ3hsc3gnO1xuICAgIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zLCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyAkdnhlLCByb3dIZWlnaHQsIGhlYWRlckFsaWduOiBhbGxIZWFkZXJBbGlnbiwgYWxpZ246IGFsbEFsaWduLCBmb290ZXJBbGlnbjogYWxsRm9vdGVyQWxpZ24gfSA9ICR0YWJsZTtcbiAgICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlO1xuICAgIGNvbnN0IHsgbWVzc2FnZSwgc2hlZXROYW1lLCBpc0hlYWRlciwgaXNGb290ZXIsIGlzTWVyZ2UsIGlzQ29sZ3JvdXAsIG9yaWdpbmFsLCB1c2VTdHlsZSwgc2hlZXRNZXRob2QgfSA9IG9wdGlvbnM7XG4gICAgY29uc3Qgc2hvd01zZyA9IG1lc3NhZ2UgIT09IGZhbHNlO1xuICAgIGNvbnN0IG1lcmdlQ2VsbHMgPSAkdGFibGUuZ2V0TWVyZ2VDZWxscygpO1xuICAgIGNvbnN0IGNvbExpc3QgPSBbXTtcbiAgICBjb25zdCBmb290TGlzdCA9IFtdO1xuICAgIGNvbnN0IHNoZWV0Q29scyA9IFtdO1xuICAgIGNvbnN0IHNoZWV0TWVyZ2VzID0gW107XG4gICAgbGV0IGJlZm9yZVJvd0NvdW50ID0gMDtcbiAgICBjb25zdCBjb2xIZWFkID0ge307XG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgY29uc3QgeyBpZCwgcHJvcGVydHksIHJlbmRlcldpZHRoIH0gPSBjb2x1bW47XG4gICAgICAgIGNvbEhlYWRbaWRdID0gb3JpZ2luYWwgPyBwcm9wZXJ0eSA6IGNvbHVtbi5nZXRUaXRsZSgpO1xuICAgICAgICBzaGVldENvbHMucHVzaCh7XG4gICAgICAgICAgICBrZXk6IGlkLFxuICAgICAgICAgICAgd2lkdGg6IFhFVXRpbHMuY2VpbChyZW5kZXJXaWR0aCAvIDgsIDEpXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIOWkhOeQhuihqOWktFxuICAgIGlmIChpc0hlYWRlcikge1xuICAgICAgICAvLyDlpITnkIbliIbnu4RcbiAgICAgICAgaWYgKGlzQ29sZ3JvdXAgJiYgIW9yaWdpbmFsICYmIGNvbGdyb3Vwcykge1xuICAgICAgICAgICAgY29sZ3JvdXBzLmZvckVhY2goKGNvbHMsIHJJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwSGVhZCA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwSGVhZFtjb2x1bW4uaWRdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb2xzLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IF9jb2xTcGFuLCBfcm93U3BhbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZENvbHVtbiA9IGdldFZhbGlkQ29sdW1uKGNvbHVtbik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbkluZGV4ID0gY29sdW1ucy5pbmRleE9mKHZhbGlkQ29sdW1uKTtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBIZWFkW3ZhbGlkQ29sdW1uLmlkXSA9IG9yaWdpbmFsID8gdmFsaWRDb2x1bW4ucHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9jb2xTcGFuID4gMSB8fCBfcm93U3BhbiA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM6IHsgcjogckluZGV4LCBjOiBjb2x1bW5JbmRleCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGU6IHsgcjogckluZGV4ICsgX3Jvd1NwYW4gLSAxLCBjOiBjb2x1bW5JbmRleCArIF9jb2xTcGFuIC0gMSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbExpc3QucHVzaChncm91cEhlYWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb2xMaXN0LnB1c2goY29sSGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgYmVmb3JlUm93Q291bnQgKz0gY29sTGlzdC5sZW5ndGg7XG4gICAgfVxuICAgIC8vIOWkhOeQhuWQiOW5tlxuICAgIGlmIChpc01lcmdlICYmICFvcmlnaW5hbCkge1xuICAgICAgICBtZXJnZUNlbGxzLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgcm93OiBtZXJnZVJvd0luZGV4LCByb3dzcGFuOiBtZXJnZVJvd3NwYW4sIGNvbDogbWVyZ2VDb2xJbmRleCwgY29sc3BhbjogbWVyZ2VDb2xzcGFuIH0gPSBtZXJnZUl0ZW07XG4gICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxuICAgICAgICAgICAgICAgIGU6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50ICsgbWVyZ2VSb3dzcGFuIC0gMSwgYzogbWVyZ2VDb2xJbmRleCArIG1lcmdlQ29sc3BhbiAtIDEgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCByb3dMaXN0ID0gZGF0YXMubWFwKGl0ZW0gPT4ge1xuICAgICAgICBjb25zdCByZXN0ID0ge307XG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICByZXN0W2NvbHVtbi5pZF0gPSBnZXRDZWxsTGFiZWwoY29sdW1uLCBpdGVtW2NvbHVtbi5pZF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3Q7XG4gICAgfSk7XG4gICAgYmVmb3JlUm93Q291bnQgKz0gcm93TGlzdC5sZW5ndGg7XG4gICAgLy8g5aSE55CG6KGo5bC+XG4gICAgaWYgKGlzRm9vdGVyKSB7XG4gICAgICAgIGNvbnN0IHsgZm9vdGVyRGF0YSB9ID0gJHRhYmxlLmdldFRhYmxlRGF0YSgpO1xuICAgICAgICBjb25zdCBmb290ZXJzID0gZ2V0Rm9vdGVyRGF0YShvcHRpb25zLCBmb290ZXJEYXRhKTtcbiAgICAgICAgY29uc3QgbWVyZ2VGb290ZXJJdGVtcyA9ICR0YWJsZS5nZXRNZXJnZUZvb3Rlckl0ZW1zKCk7XG4gICAgICAgIC8vIOWkhOeQhuWQiOW5tlxuICAgICAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICAgICAgICAgIG1lcmdlRm9vdGVySXRlbXMuZm9yRWFjaChtZXJnZUl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgcm93OiBtZXJnZVJvd0luZGV4LCByb3dzcGFuOiBtZXJnZVJvd3NwYW4sIGNvbDogbWVyZ2VDb2xJbmRleCwgY29sc3BhbjogbWVyZ2VDb2xzcGFuIH0gPSBtZXJnZUl0ZW07XG4gICAgICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHM6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50LCBjOiBtZXJnZUNvbEluZGV4IH0sXG4gICAgICAgICAgICAgICAgICAgIGU6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50ICsgbWVyZ2VSb3dzcGFuIC0gMSwgYzogbWVyZ2VDb2xJbmRleCArIG1lcmdlQ29sc3BhbiAtIDEgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9vdGVycy5mb3JFYWNoKChyb3dzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0ge307XG4gICAgICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgIGl0ZW1bY29sdW1uLmlkXSA9IGdldEZvb3RlckNlbGxWYWx1ZSgkdGFibGUsIG9wdGlvbnMsIHJvd3MsIGNvbHVtbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvb3RMaXN0LnB1c2goaXRlbSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBleHBvcnRNZXRob2QgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKTtcbiAgICAgICAgY29uc3Qgc2hlZXQgPSB3b3JrYm9vay5hZGRXb3Jrc2hlZXQoc2hlZXROYW1lKTtcbiAgICAgICAgd29ya2Jvb2suY3JlYXRvciA9ICd2eGUtdGFibGUnO1xuICAgICAgICBzaGVldC5jb2x1bW5zID0gc2hlZXRDb2xzO1xuICAgICAgICBpZiAoaXNIZWFkZXIpIHtcbiAgICAgICAgICAgIHNoZWV0LmFkZFJvd3MoY29sTGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGNlbENvbCA9IHNoZWV0LmdldENvbHVtbihleGNlbENlbGwuY29sKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sdW1uID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBoZWFkZXJBbGlnbiwgYWxpZ24gfSA9IGNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBoZWFkZXJBbGlnbiB8fCBhbGlnbiB8fCBhbGxIZWFkZXJBbGlnbiB8fCBhbGxBbGlnbik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvbGQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogOFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncGF0dGVybicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46ICdzb2xpZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZnQ29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHNoZWV0LmFkZFJvd3Mocm93TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XG4gICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sdW1uID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5KTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBhbGlnbiB8fCBhbGxBbGlnbik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0FyaWFsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiA4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNGb290ZXIpIHtcbiAgICAgICAgICAgIHNoZWV0LmFkZFJvd3MoZm9vdExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZm9vdGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgZm9vdGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsRm9vdGVyQWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiA4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VTdHlsZSAmJiBzaGVldE1ldGhvZCkge1xuICAgICAgICAgICAgY29uc3Qgc1BhcmFtcyA9IHsgb3B0aW9uczogb3B0aW9ucywgd29ya2Jvb2ssIHdvcmtzaGVldDogc2hlZXQsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMsICR0YWJsZSB9O1xuICAgICAgICAgICAgc2hlZXRNZXRob2Qoc1BhcmFtcyk7XG4gICAgICAgIH1cbiAgICAgICAgc2hlZXRNZXJnZXMuZm9yRWFjaCgoeyBzLCBlIH0pID0+IHtcbiAgICAgICAgICAgIHNoZWV0Lm1lcmdlQ2VsbHMocy5yICsgMSwgcy5jICsgMSwgZS5yICsgMSwgZS5jICsgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB3b3JrYm9vay54bHN4LndyaXRlQnVmZmVyKCkudGhlbihidWZmZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nIH0pO1xuICAgICAgICAgICAgLy8g5a+85Ye6IHhsc3hcbiAgICAgICAgICAgIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZShtc2dLZXkpO1xuICAgICAgICAgICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBjb250ZW50OiB0KCd2eGUudGFibGUuZXhwU3VjY2VzcycpLCBzdGF0dXM6ICdzdWNjZXNzJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xuICAgICAgICBtb2RhbC5tZXNzYWdlKHsgaWQ6IG1zZ0tleSwgY29udGVudDogdCgndnhlLnRhYmxlLmV4cExvYWRpbmcnKSwgc3RhdHVzOiAnbG9hZGluZycsIGR1cmF0aW9uOiAtMSB9KTtcbiAgICAgICAgc2V0VGltZW91dChleHBvcnRNZXRob2QsIDE1MDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZXhwb3J0TWV0aG9kKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZG93bmxvYWRGaWxlKHBhcmFtcywgYmxvYiwgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgJHRhYmxlIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyAkdnhlIH0gPSAkdGFibGU7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIGZpbGVuYW1lLCB0eXBlIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZTtcbiAgICBpZiAod2luZG93LkJsb2IpIHtcbiAgICAgICAgaWYgKG5hdmlnYXRvci5tc1NhdmVCbG9iKSB7XG4gICAgICAgICAgICBuYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbGlua0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaW5rRWxlbS50YXJnZXQgPSAnX2JsYW5rJztcbiAgICAgICAgICAgIGxpbmtFbGVtLmRvd25sb2FkID0gYCR7ZmlsZW5hbWV9LiR7dHlwZX1gO1xuICAgICAgICAgICAgbGlua0VsZW0uaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmtFbGVtKTtcbiAgICAgICAgICAgIGxpbmtFbGVtLmNsaWNrKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmtFbGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcbiAgICAgICAgICAgIG1vZGFsLmFsZXJ0KHsgY29udGVudDogdCgndnhlLmVycm9yLm5vdEV4cCcpLCBzdGF0dXM6ICdlcnJvcicgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja0ltcG9ydERhdGEodGFibGVGaWVsZHMsIGZpZWxkcykge1xuICAgIHJldHVybiBmaWVsZHMuc29tZShmaWVsZCA9PiB0YWJsZUZpZWxkcy5pbmRleE9mKGZpZWxkKSA+IC0xKTtcbn1cbmZ1bmN0aW9uIGltcG9ydEVycm9yKHBhcmFtcykge1xuICAgIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVqZWN0IH0gPSAkdGFibGU7XG4gICAgY29uc3Qgc2hvd01zZyA9IG9wdGlvbnMubWVzc2FnZSAhPT0gZmFsc2U7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xuICAgICAgICBtb2RhbC5tZXNzYWdlKHsgY29udGVudDogdCgndnhlLmVycm9yLmltcEZpZWxkcycpLCBzdGF0dXM6ICdlcnJvcicgfSk7XG4gICAgfVxuICAgIGlmIChfaW1wb3J0UmVqZWN0KSB7XG4gICAgICAgIF9pbXBvcnRSZWplY3QoeyBzdGF0dXM6IGZhbHNlIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGltcG9ydFhMU1gocGFyYW1zKSB7XG4gICAgY29uc3QgeyAkdGFibGUsIGNvbHVtbnMsIG9wdGlvbnMsIGZpbGUgfSA9IHBhcmFtcztcbiAgICBjb25zdCB7ICR2eGUsIF9pbXBvcnRSZXNvbHZlIH0gPSAkdGFibGU7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZTtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgfTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IChldm50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhYmxlRmllbGRzID0gW107XG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGNvbHVtbi5wcm9wZXJ0eTtcbiAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIHRhYmxlRmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpO1xuICAgICAgICBjb25zdCByZWFkZXJUYXJnZXQgPSBldm50LnRhcmdldDtcbiAgICAgICAgaWYgKHJlYWRlclRhcmdldCkge1xuICAgICAgICAgICAgd29ya2Jvb2sueGxzeC5sb2FkKHJlYWRlclRhcmdldC5yZXN1bHQpLnRoZW4od2IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0U2hlZXQgPSB3Yi53b3Jrc2hlZXRzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdFNoZWV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNoZWV0VmFsdWVzID0gZmlyc3RTaGVldC5nZXRTaGVldFZhbHVlcygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZEluZGV4ID0gWEVVdGlscy5maW5kSW5kZXhPZihzaGVldFZhbHVlcywgKGxpc3QpID0+IGxpc3QgJiYgbGlzdC5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gc2hlZXRWYWx1ZXNbZmllbGRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGNoZWNrSW1wb3J0RGF0YSh0YWJsZUZpZWxkcywgZmllbGRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IHNoZWV0VmFsdWVzLnNsaWNlKGZpZWxkSW5kZXgpLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKChjZWxsVmFsdWUsIGNJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtW2ZpZWxkc1tjSW5kZXhdXSA9IGNlbGxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWNvcmQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJsZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkW2ZpZWxkXSA9IFhFVXRpbHMuaXNVbmRlZmluZWQoaXRlbVtmaWVsZF0pID8gbnVsbCA6IGl0ZW1bZmllbGRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YWJsZS5jcmVhdGVEYXRhKHJlY29yZHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9hZFJlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUuaW5zZXJ0QXQoZGF0YSwgLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUucmVsb2FkRGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRSZXN0LnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX2ltcG9ydFJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pbXBvcnRSZXNvbHZlKHsgc3RhdHVzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWwubWVzc2FnZSh7IGNvbnRlbnQ6IHQoJ3Z4ZS50YWJsZS5pbXBTdWNjZXNzJywgW3JlY29yZHMubGVuZ3RoXSksIHN0YXR1czogJ3N1Y2Nlc3MnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG59XG5mdW5jdGlvbiBoYW5kbGVJbXBvcnRFdmVudChwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XG4gICAgICAgIGltcG9ydFhMU1gocGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGhhbmRsZUV4cG9ydEV2ZW50KHBhcmFtcykge1xuICAgIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcbiAgICAgICAgZXhwb3J0WExTWChwYXJhbXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLyoqXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOaUr+aMgeWvvOWHuiB4bHN4IOagvOW8j1xuICovXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYID0ge1xuICAgIGluc3RhbGwodnhldGFibGUpIHtcbiAgICAgICAgY29uc3QgeyBpbnRlcmNlcHRvciB9ID0gdnhldGFibGU7XG4gICAgICAgIHZ4ZXRhYmxlLnNldHVwKHtcbiAgICAgICAgICAgIGV4cG9ydDoge1xuICAgICAgICAgICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHhsc3g6IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpbnRlcmNlcHRvci5taXhpbih7XG4gICAgICAgICAgICAnZXZlbnQuaW1wb3J0JzogaGFuZGxlSW1wb3J0RXZlbnQsXG4gICAgICAgICAgICAnZXZlbnQuZXhwb3J0JzogaGFuZGxlRXhwb3J0RXZlbnRcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuVlhFVGFibGUgJiYgd2luZG93LlZYRVRhYmxlLnVzZSkge1xuICAgIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYKTtcbn1cbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWDtcbiJdfQ==
