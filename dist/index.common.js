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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIiwiaW5kZXguanMiXSwibmFtZXMiOlsiZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciIsImRlZmF1bHRDZWxsRm9udENvbG9yIiwiZGVmYXVsdENlbGxCb3JkZXJTdHlsZSIsImRlZmF1bHRDZWxsQm9yZGVyQ29sb3IiLCJnZXRDZWxsTGFiZWwiLCJjb2x1bW4iLCJjZWxsVmFsdWUiLCJjZWxsVHlwZSIsIlhFVXRpbHMiLCJ0b1ZhbHVlU3RyaW5nIiwiaXNOYU4iLCJOdW1iZXIiLCJsZW5ndGgiLCJnZXRGb290ZXJEYXRhIiwib3B0cyIsImZvb3RlckRhdGEiLCJmb290ZXJGaWx0ZXJNZXRob2QiLCJmaWx0ZXIiLCJpdGVtcyIsImluZGV4IiwiJHJvd0luZGV4IiwiZ2V0Rm9vdGVyQ2VsbFZhbHVlIiwiJHRhYmxlIiwicm93cyIsImdldFZNQ29sdW1uSW5kZXgiLCJnZXRWYWxpZENvbHVtbiIsImNoaWxkTm9kZXMiLCJpc0NvbEdyb3VwIiwic2V0RXhjZWxSb3dIZWlnaHQiLCJleGNlbFJvdyIsImhlaWdodCIsImZsb29yIiwic2V0RXhjZWxDZWxsU3R5bGUiLCJleGNlbENlbGwiLCJhbGlnbiIsInByb3RlY3Rpb24iLCJsb2NrZWQiLCJhbGlnbm1lbnQiLCJ2ZXJ0aWNhbCIsImhvcml6b250YWwiLCJmb250IiwibmFtZSIsInNpemUiLCJnZXREZWZhdWx0Qm9yZGVyU3R5bGUiLCJ0b3AiLCJzdHlsZSIsImNvbG9yIiwiYXJnYiIsImxlZnQiLCJib3R0b20iLCJyaWdodCIsImV4cG9ydFhMU1giLCJwYXJhbXMiLCJtc2dLZXkiLCJvcHRpb25zIiwiY29sdW1ucyIsImNvbGdyb3VwcyIsImRhdGFzIiwiJHZ4ZSIsInJvd0hlaWdodCIsImFsbEhlYWRlckFsaWduIiwiaGVhZGVyQWxpZ24iLCJhbGxBbGlnbiIsImFsbEZvb3RlckFsaWduIiwiZm9vdGVyQWxpZ24iLCJtb2RhbCIsInQiLCJtZXNzYWdlIiwic2hlZXROYW1lIiwiaXNIZWFkZXIiLCJpc0Zvb3RlciIsImlzTWVyZ2UiLCJpc0NvbGdyb3VwIiwib3JpZ2luYWwiLCJ1c2VTdHlsZSIsInNoZWV0TWV0aG9kIiwic2hvd01zZyIsIm1lcmdlQ2VsbHMiLCJnZXRNZXJnZUNlbGxzIiwiY29sTGlzdCIsImZvb3RMaXN0Iiwic2hlZXRDb2xzIiwic2hlZXRNZXJnZXMiLCJiZWZvcmVSb3dDb3VudCIsImNvbEhlYWQiLCJmb3JFYWNoIiwiaWQiLCJwcm9wZXJ0eSIsInJlbmRlcldpZHRoIiwiZ2V0VGl0bGUiLCJwdXNoIiwia2V5Iiwid2lkdGgiLCJjZWlsIiwiY29scyIsInJJbmRleCIsImdyb3VwSGVhZCIsIl9jb2xTcGFuIiwiX3Jvd1NwYW4iLCJ2YWxpZENvbHVtbiIsImNvbHVtbkluZGV4IiwiaW5kZXhPZiIsInMiLCJyIiwiYyIsImUiLCJtZXJnZUl0ZW0iLCJtZXJnZVJvd0luZGV4Iiwicm93IiwibWVyZ2VSb3dzcGFuIiwicm93c3BhbiIsIm1lcmdlQ29sSW5kZXgiLCJjb2wiLCJtZXJnZUNvbHNwYW4iLCJjb2xzcGFuIiwicm93TGlzdCIsIm1hcCIsIml0ZW0iLCJyZXN0IiwiZ2V0VGFibGVEYXRhIiwiZm9vdGVycyIsIm1lcmdlRm9vdGVySXRlbXMiLCJnZXRNZXJnZUZvb3Rlckl0ZW1zIiwiZXhwb3J0TWV0aG9kIiwid29ya2Jvb2siLCJFeGNlbEpTIiwiV29ya2Jvb2siLCJzaGVldCIsImFkZFdvcmtzaGVldCIsImNyZWF0b3IiLCJhZGRSb3dzIiwiZWFjaENlbGwiLCJleGNlbENvbCIsImdldENvbHVtbiIsImdldENvbHVtbkJ5SWQiLCJPYmplY3QiLCJhc3NpZ24iLCJib2xkIiwiZmlsbCIsInR5cGUiLCJwYXR0ZXJuIiwiZmdDb2xvciIsImJvcmRlciIsInNQYXJhbXMiLCJ3b3Jrc2hlZXQiLCJ4bHN4Iiwid3JpdGVCdWZmZXIiLCJ0aGVuIiwiYnVmZmVyIiwiYmxvYiIsIkJsb2IiLCJkb3dubG9hZEZpbGUiLCJjbG9zZSIsImNvbnRlbnQiLCJzdGF0dXMiLCJkdXJhdGlvbiIsInNldFRpbWVvdXQiLCJmaWxlbmFtZSIsIndpbmRvdyIsIm5hdmlnYXRvciIsIm1zU2F2ZUJsb2IiLCJsaW5rRWxlbSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInRhcmdldCIsImRvd25sb2FkIiwiaHJlZiIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJhbGVydCIsImNoZWNrSW1wb3J0RGF0YSIsInRhYmxlRmllbGRzIiwiZmllbGRzIiwic29tZSIsImZpZWxkIiwiaW1wb3J0RXJyb3IiLCJfaW1wb3J0UmVqZWN0IiwiaW1wb3J0WExTWCIsImZpbGUiLCJfaW1wb3J0UmVzb2x2ZSIsImZpbGVSZWFkZXIiLCJGaWxlUmVhZGVyIiwib25lcnJvciIsIm9ubG9hZCIsImV2bnQiLCJyZWFkZXJUYXJnZXQiLCJsb2FkIiwicmVzdWx0Iiwid2IiLCJmaXJzdFNoZWV0Iiwid29ya3NoZWV0cyIsInNoZWV0VmFsdWVzIiwiZ2V0U2hlZXRWYWx1ZXMiLCJmaWVsZEluZGV4IiwiZmluZEluZGV4T2YiLCJsaXN0IiwicmVjb3JkcyIsInNsaWNlIiwiY0luZGV4IiwicmVjb3JkIiwiaXNVbmRlZmluZWQiLCJjcmVhdGVEYXRhIiwiZGF0YSIsImxvYWRSZXN0IiwibW9kZSIsImluc2VydEF0IiwicmVsb2FkRGF0YSIsInJlYWRBc0FycmF5QnVmZmVyIiwiaGFuZGxlSW1wb3J0RXZlbnQiLCJoYW5kbGVFeHBvcnRFdmVudCIsIlZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWCIsImluc3RhbGwiLCJ2eGV0YWJsZSIsImludGVyY2VwdG9yIiwic2V0dXAiLCJ0eXBlcyIsIm1peGluIiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQVVBOzs7Ozs7OztBQUVBLElBQU1BLDRCQUE0QixHQUFHLFFBQXJDO0FBQ0EsSUFBTUMsb0JBQW9CLEdBQUcsUUFBN0I7QUFDQSxJQUFNQyxzQkFBc0IsR0FB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Q2xDeEYsSUFBQUEsVUFBVSxDQUFDQyxNQUFELENBQVY7QUFDQSxXQUFPLEtBQVA7QUFDRDtBQUNGO0FBRUQ7QUMvQkE7QUFDQTs7O0FEaUNPLElBQU1rSyx3QkFBd0IsR0FBRztBQUN0Q0MsRUFBQUEsT0FEc0MsbUJBQzdCQyxRQUQ2QixFQUNKO0FBQ2hDLFFBQVFDLFdBQVIsR0FBd0JELFFBQXhCLENBQVFDLFdBQVI7QUFDQUQsSUFBQUEsUUFBUSxDQUFDRSxLQUFULENBQWU7QUFDYixnQkFBUTtBQUNOQyxRQUFBQSxLQUFLLEVBQUU7QUFDTDFFLFVBQUFBLElBQUksRUFBRTtBQUREO0FBREQ7QUFESyxLQUFmO0FBT0F3RSxJQUFBQSxXQUFXLENBQUNHLEtBQVosQ0FBa0I7QUFDaEIsc0JBQWdCUixpQkFEQTtBQUVoQixzQkFBZ0JDO0FBRkEsS0FBbEI7QUFJRDtBQWRxQyxDQUFqQzs7O0FBaUJQLElBQUksT0FBT3ZELE1BQVAsS0FBa0IsV0FBbEIsSUFBaUNBLE1BQU0sQ0FBQytELFFBQXhDLElBQW9EL0QsTUFBTSxDQUFDK0QsUUFBUCxDQUFnQkMsR0FBeEUsRUFBNkU7QUFDM0VoRSxFQUFBQSxNQUFNLENBQUMrRCxRQUFQLENBQWdCQyxHQUFoQixDQUFvQlIsd0JBQXBCO0FBQ0Q7O2VBRWNBLHdCIiwiZmlsZSI6ImluZGV4LmNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBYRVV0aWxzIGZyb20gJ3hlLXV0aWxzJ1xyXG5pbXBvcnQge1xyXG4gIFZYRVRhYmxlLFxyXG4gIFRhYmxlLFxyXG4gIEludGVyY2VwdG9yRXhwb3J0UGFyYW1zLFxyXG4gIEludGVyY2VwdG9ySW1wb3J0UGFyYW1zLFxyXG4gIENvbHVtbkNvbmZpZyxcclxuICBUYWJsZUV4cG9ydENvbmZpZyxcclxuICBDb2x1bW5BbGlnblxyXG59IGZyb20gJ3Z4ZS10YWJsZSdcclxuaW1wb3J0ICogYXMgRXhjZWxKUyBmcm9tICdleGNlbGpzJ1xyXG5cclxuY29uc3QgZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciA9ICdmOGY4ZjknXHJcbmNvbnN0IGRlZmF1bHRDZWxsRm9udENvbG9yID0gJzYwNjI2NidcclxuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJTdHlsZSA9ICd0aGluJ1xyXG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yID0gJ2U4ZWFlYydcclxuXHJcbmZ1bmN0aW9uIGdldENlbGxMYWJlbCAoY29sdW1uOiBDb2x1bW5Db25maWcsIGNlbGxWYWx1ZTogYW55KSB7XHJcbiAgaWYgKGNlbGxWYWx1ZSkge1xyXG4gICAgc3dpdGNoIChjb2x1bW4uY2VsbFR5cGUpIHtcclxuICAgICAgY2FzZSAnc3RyaW5nJzpcclxuICAgICAgICByZXR1cm4gWEVVdGlscy50b1ZhbHVlU3RyaW5nKGNlbGxWYWx1ZSlcclxuICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICBpZiAoIWlzTmFOKGNlbGxWYWx1ZSkpIHtcclxuICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBicmVha1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGlmIChjZWxsVmFsdWUubGVuZ3RoIDwgMTIgJiYgIWlzTmFOKGNlbGxWYWx1ZSkpIHtcclxuICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gY2VsbFZhbHVlXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEZvb3RlckRhdGEgKG9wdHM6IFRhYmxlRXhwb3J0Q29uZmlnLCBmb290ZXJEYXRhOiBhbnlbXVtdKSB7XHJcbiAgY29uc3QgeyBmb290ZXJGaWx0ZXJNZXRob2QgfSA9IG9wdHNcclxuICByZXR1cm4gZm9vdGVyRmlsdGVyTWV0aG9kID8gZm9vdGVyRGF0YS5maWx0ZXIoKGl0ZW1zLCBpbmRleCkgPT4gZm9vdGVyRmlsdGVyTWV0aG9kKHsgaXRlbXMsICRyb3dJbmRleDogaW5kZXggfSkpIDogZm9vdGVyRGF0YVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRGb290ZXJDZWxsVmFsdWUgKCR0YWJsZTogVGFibGUsIG9wdHM6IFRhYmxlRXhwb3J0Q29uZmlnLCByb3dzOiBhbnlbXSwgY29sdW1uOiBDb2x1bW5Db25maWcpIHtcclxuICBjb25zdCBjZWxsVmFsdWUgPSBnZXRDZWxsTGFiZWwoY29sdW1uLCByb3dzWyR0YWJsZS5nZXRWTUNvbHVtbkluZGV4KGNvbHVtbildKVxyXG4gIHJldHVybiBjZWxsVmFsdWVcclxufVxyXG5cclxuZGVjbGFyZSBtb2R1bGUgJ3Z4ZS10YWJsZScge1xyXG4gIGludGVyZmFjZSBDb2x1bW5JbmZvIHtcclxuICAgIF9yb3c6IGFueTtcclxuICAgIF9jb2xTcGFuOiBudW1iZXI7XHJcbiAgICBfcm93U3BhbjogbnVtYmVyO1xyXG4gICAgY2hpbGROb2RlczogQ29sdW1uQ29uZmlnW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRWYWxpZENvbHVtbiAoY29sdW1uOiBDb2x1bW5Db25maWcpOiBDb2x1bW5Db25maWcge1xyXG4gIGNvbnN0IHsgY2hpbGROb2RlcyB9ID0gY29sdW1uXHJcbiAgY29uc3QgaXNDb2xHcm91cCA9IGNoaWxkTm9kZXMgJiYgY2hpbGROb2Rlcy5sZW5ndGhcclxuICBpZiAoaXNDb2xHcm91cCkge1xyXG4gICAgcmV0dXJuIGdldFZhbGlkQ29sdW1uKGNoaWxkTm9kZXNbMF0pXHJcbiAgfVxyXG4gIHJldHVybiBjb2x1bW5cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0RXhjZWxSb3dIZWlnaHQgKGV4Y2VsUm93OiBFeGNlbEpTLlJvdywgaGVpZ2h0OiBudW1iZXIpIHtcclxuICBpZiAoaGVpZ2h0KSB7XHJcbiAgICBleGNlbFJvdy5oZWlnaHQgPSBYRVV0aWxzLmZsb29yKGhlaWdodCAqIDAuNzUsIDEyKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0RXhjZWxDZWxsU3R5bGUgKGV4Y2VsQ2VsbDogRXhjZWxKUy5DZWxsLCBhbGlnbj86IENvbHVtbkFsaWduKSB7XHJcbiAgZXhjZWxDZWxsLnByb3RlY3Rpb24gPSB7XHJcbiAgICBsb2NrZWQ6IGZhbHNlXHJcbiAgfVxyXG4gIGV4Y2VsQ2VsbC5hbGlnbm1lbnQgPSB7XHJcbiAgICB2ZXJ0aWNhbDogJ21pZGRsZScsXHJcbiAgICBob3Jpem9udGFsOiBhbGlnbiB8fCAnbGVmdCdcclxuICB9XHJcbiAgZXhjZWxDZWxsLmZvbnQgPSB7XHJcbiAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgc2l6ZTogOFxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJvcmRlclN0eWxlICgpIHtcclxuICByZXR1cm4ge1xyXG4gICAgdG9wOiB7XHJcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxyXG4gICAgICBjb2xvcjoge1xyXG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxlZnQ6IHtcclxuICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXHJcbiAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYm90dG9tOiB7XHJcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxyXG4gICAgICBjb2xvcjoge1xyXG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJpZ2h0OiB7XHJcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxyXG4gICAgICBjb2xvcjoge1xyXG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXhwb3J0WExTWCAocGFyYW1zOiBJbnRlcmNlcHRvckV4cG9ydFBhcmFtcykge1xyXG4gIGNvbnN0IG1zZ0tleSA9ICd4bHN4J1xyXG4gIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zLCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzIH0gPSBwYXJhbXNcclxuICBjb25zdCB7ICR2eGUsIHJvd0hlaWdodCwgaGVhZGVyQWxpZ246IGFsbEhlYWRlckFsaWduLCBhbGlnbjogYWxsQWxpZ24sIGZvb3RlckFsaWduOiBhbGxGb290ZXJBbGlnbiB9ID0gJHRhYmxlXHJcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxyXG4gIGNvbnN0IHsgbWVzc2FnZSwgc2hlZXROYW1lLCBpc0hlYWRlciwgaXNGb290ZXIsIGlzTWVyZ2UsIGlzQ29sZ3JvdXAsIG9yaWdpbmFsLCB1c2VTdHlsZSwgc2hlZXRNZXRob2QgfSA9IG9wdGlvbnNcclxuICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2VcclxuICBjb25zdCBtZXJnZUNlbGxzID0gJHRhYmxlLmdldE1lcmdlQ2VsbHMoKVxyXG4gIGNvbnN0IGNvbExpc3Q6IGFueVtdID0gW11cclxuICBjb25zdCBmb290TGlzdDogYW55W10gPSBbXVxyXG4gIGNvbnN0IHNoZWV0Q29sczogYW55W10gPSBbXVxyXG4gIGNvbnN0IHNoZWV0TWVyZ2VzOiB7IHM6IHsgcjogbnVtYmVyLCBjOiBudW1iZXIgfSwgZTogeyByOiBudW1iZXIsIGM6IG51bWJlciB9IH1bXSA9IFtdXHJcbiAgbGV0IGJlZm9yZVJvd0NvdW50ID0gMFxyXG4gIGNvbnN0IGNvbEhlYWQ6IGFueSA9IHt9XHJcbiAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgIGNvbnN0IHsgaWQsIHByb3BlcnR5LCByZW5kZXJXaWR0aCB9ID0gY29sdW1uXHJcbiAgICBjb2xIZWFkW2lkXSA9IG9yaWdpbmFsID8gcHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKVxyXG4gICAgc2hlZXRDb2xzLnB1c2goe1xyXG4gICAgICBrZXk6IGlkLFxyXG4gICAgICB3aWR0aDogWEVVdGlscy5jZWlsKHJlbmRlcldpZHRoIC8gOCwgMSlcclxuICAgIH0pXHJcbiAgfSlcclxuICAvLyDlpITnkIbooajlpLRcclxuICBpZiAoaXNIZWFkZXIpIHtcclxuICAgIC8vIOWkhOeQhuWIhue7hFxyXG4gICAgaWYgKGlzQ29sZ3JvdXAgJiYgIW9yaWdpbmFsICYmIGNvbGdyb3Vwcykge1xyXG4gICAgICBjb2xncm91cHMuZm9yRWFjaCgoY29scywgckluZGV4KSA9PiB7XHJcbiAgICAgICAgY29uc3QgZ3JvdXBIZWFkOiBhbnkgPSB7fVxyXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XHJcbiAgICAgICAgICBncm91cEhlYWRbY29sdW1uLmlkXSA9IG51bGxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbHMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB7IF9jb2xTcGFuLCBfcm93U3BhbiB9ID0gY29sdW1uXHJcbiAgICAgICAgICBjb25zdCB2YWxpZENvbHVtbiA9IGdldFZhbGlkQ29sdW1uKGNvbHVtbilcclxuICAgICAgICAgIGNvbnN0IGNvbHVtbkluZGV4ID0gY29sdW1ucy5pbmRleE9mKHZhbGlkQ29sdW1uKVxyXG4gICAgICAgICAgZ3JvdXBIZWFkW3ZhbGlkQ29sdW1uLmlkXSA9IG9yaWdpbmFsID8gdmFsaWRDb2x1bW4ucHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKVxyXG4gICAgICAgICAgaWYgKF9jb2xTcGFuID4gMSB8fCBfcm93U3BhbiA+IDEpIHtcclxuICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgczogeyByOiBySW5kZXgsIGM6IGNvbHVtbkluZGV4IH0sXHJcbiAgICAgICAgICAgICAgZTogeyByOiBySW5kZXggKyBfcm93U3BhbiAtIDEsIGM6IGNvbHVtbkluZGV4ICsgX2NvbFNwYW4gLSAxIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbExpc3QucHVzaChncm91cEhlYWQpXHJcbiAgICAgIH0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb2xMaXN0LnB1c2goY29sSGVhZClcclxuICAgIH1cclxuICAgIGJlZm9yZVJvd0NvdW50ICs9IGNvbExpc3QubGVuZ3RoXHJcbiAgfVxyXG4gIC8vIOWkhOeQhuWQiOW5tlxyXG4gIGlmIChpc01lcmdlICYmICFvcmlnaW5hbCkge1xyXG4gICAgbWVyZ2VDZWxscy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IHsgcm93OiBtZXJnZVJvd0luZGV4LCByb3dzcGFuOiBtZXJnZVJvd3NwYW4sIGNvbDogbWVyZ2VDb2xJbmRleCwgY29sc3BhbjogbWVyZ2VDb2xzcGFuIH0gPSBtZXJnZUl0ZW1cclxuICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XHJcbiAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcclxuICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgfVxyXG4gIGNvbnN0IHJvd0xpc3QgPSBkYXRhcy5tYXAoaXRlbSA9PiB7XHJcbiAgICBjb25zdCByZXN0OiBhbnkgPSB7fVxyXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgcmVzdFtjb2x1bW4uaWRdID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgaXRlbVtjb2x1bW4uaWRdKVxyXG4gICAgfSlcclxuICAgIHJldHVybiByZXN0XHJcbiAgfSlcclxuICBiZWZvcmVSb3dDb3VudCArPSByb3dMaXN0Lmxlbmd0aFxyXG4gIC8vIOWkhOeQhuihqOWwvlxyXG4gIGlmIChpc0Zvb3Rlcikge1xyXG4gICAgY29uc3QgeyBmb290ZXJEYXRhIH0gPSAkdGFibGUuZ2V0VGFibGVEYXRhKClcclxuICAgIGNvbnN0IGZvb3RlcnMgPSBnZXRGb290ZXJEYXRhKG9wdGlvbnMsIGZvb3RlckRhdGEpXHJcbiAgICBjb25zdCBtZXJnZUZvb3Rlckl0ZW1zID0gJHRhYmxlLmdldE1lcmdlRm9vdGVySXRlbXMoKVxyXG4gICAgLy8g5aSE55CG5ZCI5bm2XHJcbiAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcclxuICAgICAgbWVyZ2VGb290ZXJJdGVtcy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XHJcbiAgICAgICAgY29uc3QgeyByb3c6IG1lcmdlUm93SW5kZXgsIHJvd3NwYW46IG1lcmdlUm93c3BhbiwgY29sOiBtZXJnZUNvbEluZGV4LCBjb2xzcGFuOiBtZXJnZUNvbHNwYW4gfSA9IG1lcmdlSXRlbVxyXG4gICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xyXG4gICAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcclxuICAgICAgICAgIGU6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50ICsgbWVyZ2VSb3dzcGFuIC0gMSwgYzogbWVyZ2VDb2xJbmRleCArIG1lcmdlQ29sc3BhbiAtIDEgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBmb290ZXJzLmZvckVhY2goKHJvd3MpID0+IHtcclxuICAgICAgY29uc3QgaXRlbTogYW55ID0ge31cclxuICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcclxuICAgICAgICBpdGVtW2NvbHVtbi5pZF0gPSBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRpb25zLCByb3dzLCBjb2x1bW4pXHJcbiAgICAgIH0pXHJcbiAgICAgIGZvb3RMaXN0LnB1c2goaXRlbSlcclxuICAgIH0pXHJcbiAgfVxyXG4gIGNvbnN0IGV4cG9ydE1ldGhvZCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxyXG4gICAgY29uc3Qgc2hlZXQgPSB3b3JrYm9vay5hZGRXb3Jrc2hlZXQoc2hlZXROYW1lKVxyXG4gICAgd29ya2Jvb2suY3JlYXRvciA9ICd2eGUtdGFibGUnXHJcbiAgICBzaGVldC5jb2x1bW5zID0gc2hlZXRDb2xzXHJcbiAgICBpZiAoaXNIZWFkZXIpIHtcclxuICAgICAgc2hlZXQuYWRkUm93cyhjb2xMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcclxuICAgICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XHJcbiAgICAgICAgICBjb25zdCBleGNlbENvbCA9IHNoZWV0LmdldENvbHVtbihleGNlbENlbGwuY29sKVxyXG4gICAgICAgICAgY29uc3QgY29sdW1uOiBhbnkgPSAkdGFibGUuZ2V0Q29sdW1uQnlJZChleGNlbENvbC5rZXkgYXMgc3RyaW5nKVxyXG4gICAgICAgICAgY29uc3QgeyBoZWFkZXJBbGlnbiwgYWxpZ24gfSA9IGNvbHVtblxyXG4gICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBoZWFkZXJBbGlnbiB8fCBhbGlnbiB8fCBhbGxIZWFkZXJBbGlnbiB8fCBhbGxBbGlnbilcclxuICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xyXG4gICAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXHJcbiAgICAgICAgICAgICAgICBib2xkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogOFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZmlsbDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BhdHRlcm4nLFxyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogJ3NvbGlkJyxcclxuICAgICAgICAgICAgICAgIGZnQ29sb3I6IHtcclxuICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvclxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzaGVldC5hZGRSb3dzKHJvd0xpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xyXG4gICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KVxyXG4gICAgICB9XHJcbiAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XHJcbiAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbClcclxuICAgICAgICBjb25zdCBjb2x1bW46IGFueSA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSBhcyBzdHJpbmcpXHJcbiAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uXHJcbiAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBhbGlnbiB8fCBhbGxBbGlnbilcclxuICAgICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XHJcbiAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgICAgICAgICAgIHNpemU6IDgsXHJcbiAgICAgICAgICAgICAgY29sb3I6IHtcclxuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBpZiAoaXNGb290ZXIpIHtcclxuICAgICAgc2hlZXQuYWRkUm93cyhmb290TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XHJcbiAgICAgICAgaWYgKHVzZVN0eWxlKSB7XHJcbiAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbClcclxuICAgICAgICAgIGNvbnN0IGNvbHVtbjogYW55ID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5IGFzIHN0cmluZylcclxuICAgICAgICAgIGNvbnN0IHsgZm9vdGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW5cclxuICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgZm9vdGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsRm9vdGVyQWxpZ24gfHwgYWxsQWxpZ24pXHJcbiAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcclxuICAgICAgICAgICAgICBmb250OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogOCxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGlmICh1c2VTdHlsZSAmJiBzaGVldE1ldGhvZCkge1xyXG4gICAgICBjb25zdCBzUGFyYW1zID0geyBvcHRpb25zOiBvcHRpb25zIGFzIGFueSwgd29ya2Jvb2ssIHdvcmtzaGVldDogc2hlZXQsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMsICR0YWJsZSB9XHJcbiAgICAgIHNoZWV0TWV0aG9kKHNQYXJhbXMpXHJcbiAgICB9XHJcbiAgICBzaGVldE1lcmdlcy5mb3JFYWNoKCh7IHMsIGUgfSkgPT4ge1xyXG4gICAgICBzaGVldC5tZXJnZUNlbGxzKHMuciArIDEsIHMuYyArIDEsIGUuciArIDEsIGUuYyArIDEpXHJcbiAgICB9KVxyXG4gICAgd29ya2Jvb2sueGxzeC53cml0ZUJ1ZmZlcigpLnRoZW4oYnVmZmVyID0+IHtcclxuICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nIH0pXHJcbiAgICAgIC8vIOWvvOWHuiB4bHN4XHJcbiAgICAgIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpXHJcbiAgICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XHJcbiAgICAgICAgbW9kYWwuY2xvc2UobXNnS2V5KVxyXG4gICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBjb250ZW50OiB0KCd2eGUudGFibGUuZXhwU3VjY2VzcycpIGFzIHN0cmluZywgc3RhdHVzOiAnc3VjY2VzcycgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcclxuICAgIG1vZGFsLm1lc3NhZ2UoeyBpZDogbXNnS2V5LCBjb250ZW50OiB0KCd2eGUudGFibGUuZXhwTG9hZGluZycpIGFzIHN0cmluZywgc3RhdHVzOiAnbG9hZGluZycsIGR1cmF0aW9uOiAtMSB9KVxyXG4gICAgc2V0VGltZW91dChleHBvcnRNZXRob2QsIDE1MDApXHJcbiAgfSBlbHNlIHtcclxuICAgIGV4cG9ydE1ldGhvZCgpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkb3dubG9hZEZpbGUgKHBhcmFtczogSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsIGJsb2I6IEJsb2IsIG9wdGlvbnM6IFRhYmxlRXhwb3J0Q29uZmlnKSB7XHJcbiAgY29uc3QgeyAkdGFibGUgfSA9IHBhcmFtc1xyXG4gIGNvbnN0IHsgJHZ4ZSB9ID0gJHRhYmxlXHJcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxyXG4gIGNvbnN0IHsgbWVzc2FnZSwgZmlsZW5hbWUsIHR5cGUgfSA9IG9wdGlvbnNcclxuICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2VcclxuICBpZiAod2luZG93LkJsb2IpIHtcclxuICAgIGlmICgobmF2aWdhdG9yIGFzIGFueSkubXNTYXZlQmxvYikge1xyXG4gICAgICAobmF2aWdhdG9yIGFzIGFueSkubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBsaW5rRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxyXG4gICAgICBsaW5rRWxlbS50YXJnZXQgPSAnX2JsYW5rJ1xyXG4gICAgICBsaW5rRWxlbS5kb3dubG9hZCA9IGAke2ZpbGVuYW1lfS4ke3R5cGV9YFxyXG4gICAgICBsaW5rRWxlbS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKVxyXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmtFbGVtKVxyXG4gICAgICBsaW5rRWxlbS5jbGljaygpXHJcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGlua0VsZW0pXHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XHJcbiAgICAgIG1vZGFsLmFsZXJ0KHsgY29udGVudDogdCgndnhlLmVycm9yLm5vdEV4cCcpIGFzIHN0cmluZywgc3RhdHVzOiAnZXJyb3InIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0ltcG9ydERhdGEgKHRhYmxlRmllbGRzOiBzdHJpbmdbXSwgZmllbGRzOiBzdHJpbmdbXSkge1xyXG4gIHJldHVybiBmaWVsZHMuc29tZShmaWVsZCA9PiB0YWJsZUZpZWxkcy5pbmRleE9mKGZpZWxkKSA+IC0xKVxyXG59XHJcblxyXG5kZWNsYXJlIG1vZHVsZSAndnhlLXRhYmxlJyB7XHJcbiAgaW50ZXJmYWNlIFRhYmxlIHtcclxuICAgIF9pbXBvcnRSZXNvbHZlPzogRnVuY3Rpb24gfCBudWxsO1xyXG4gICAgX2ltcG9ydFJlamVjdD86IEZ1bmN0aW9uIHwgbnVsbDtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gaW1wb3J0RXJyb3IgKHBhcmFtczogSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMpIHtcclxuICBjb25zdCB7ICR0YWJsZSwgb3B0aW9ucyB9ID0gcGFyYW1zXHJcbiAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVqZWN0IH0gPSAkdGFibGVcclxuICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZVxyXG4gIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGVcclxuICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xyXG4gICAgbW9kYWwubWVzc2FnZSh7IGNvbnRlbnQ6IHQoJ3Z4ZS5lcnJvci5pbXBGaWVsZHMnKSBhcyBzdHJpbmcsIHN0YXR1czogJ2Vycm9yJyB9KVxyXG4gIH1cclxuICBpZiAoX2ltcG9ydFJlamVjdCkge1xyXG4gICAgX2ltcG9ydFJlamVjdCh7IHN0YXR1czogZmFsc2UgfSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGltcG9ydFhMU1ggKHBhcmFtczogSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMpIHtcclxuICBjb25zdCB7ICR0YWJsZSwgY29sdW1ucywgb3B0aW9ucywgZmlsZSB9ID0gcGFyYW1zXHJcbiAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVzb2x2ZSB9ID0gJHRhYmxlXHJcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxyXG4gIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlXHJcbiAgY29uc3QgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcclxuICBmaWxlUmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICBpbXBvcnRFcnJvcihwYXJhbXMpXHJcbiAgfVxyXG4gIGZpbGVSZWFkZXIub25sb2FkID0gKGV2bnQpID0+IHtcclxuICAgIGNvbnN0IHRhYmxlRmllbGRzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xyXG4gICAgICBjb25zdCBmaWVsZCA9IGNvbHVtbi5wcm9wZXJ0eVxyXG4gICAgICBpZiAoZmllbGQpIHtcclxuICAgICAgICB0YWJsZUZpZWxkcy5wdXNoKGZpZWxkKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpXHJcbiAgICBjb25zdCByZWFkZXJUYXJnZXQgPSBldm50LnRhcmdldFxyXG4gICAgaWYgKHJlYWRlclRhcmdldCkge1xyXG4gICAgICB3b3JrYm9vay54bHN4LmxvYWQocmVhZGVyVGFyZ2V0LnJlc3VsdCBhcyBBcnJheUJ1ZmZlcikudGhlbih3YiA9PiB7XHJcbiAgICAgICAgY29uc3QgZmlyc3RTaGVldCA9IHdiLndvcmtzaGVldHNbMF1cclxuICAgICAgICBpZiAoZmlyc3RTaGVldCkge1xyXG4gICAgICAgICAgY29uc3Qgc2hlZXRWYWx1ZXMgPSBmaXJzdFNoZWV0LmdldFNoZWV0VmFsdWVzKCkgYXMgc3RyaW5nW11bXVxyXG4gICAgICAgICAgY29uc3QgZmllbGRJbmRleCA9IFhFVXRpbHMuZmluZEluZGV4T2Yoc2hlZXRWYWx1ZXMsIChsaXN0KSA9PiBsaXN0ICYmIGxpc3QubGVuZ3RoID4gMClcclxuICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IHNoZWV0VmFsdWVzW2ZpZWxkSW5kZXhdIGFzIHN0cmluZ1tdXHJcbiAgICAgICAgICBjb25zdCBzdGF0dXMgPSBjaGVja0ltcG9ydERhdGEodGFibGVGaWVsZHMsIGZpZWxkcylcclxuICAgICAgICAgIGlmIChzdGF0dXMpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IHNoZWV0VmFsdWVzLnNsaWNlKGZpZWxkSW5kZXgpLm1hcChsaXN0ID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBpdGVtIDogYW55ID0ge31cclxuICAgICAgICAgICAgICBsaXN0LmZvckVhY2goKGNlbGxWYWx1ZSwgY0luZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpdGVtW2ZpZWxkc1tjSW5kZXhdXSA9IGNlbGxWYWx1ZVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgY29uc3QgcmVjb3JkOiBhbnkgPSB7fVxyXG4gICAgICAgICAgICAgIHRhYmxlRmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVjb3JkW2ZpZWxkXSA9IFhFVXRpbHMuaXNVbmRlZmluZWQoaXRlbVtmaWVsZF0pID8gbnVsbCA6IGl0ZW1bZmllbGRdXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICR0YWJsZS5jcmVhdGVEYXRhKHJlY29yZHMpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKGRhdGE6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbG9hZFJlc3Q6IFByb21pc2U8YW55PlxyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2luc2VydCcpIHtcclxuICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUuaW5zZXJ0QXQoZGF0YSwgLTEpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBsb2FkUmVzdCA9ICR0YWJsZS5yZWxvYWREYXRhKGRhdGEpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9hZFJlc3QudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChfaW1wb3J0UmVzb2x2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9pbXBvcnRSZXNvbHZlKHsgc3RhdHVzOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcclxuICAgICAgICAgICAgICBtb2RhbC5tZXNzYWdlKHsgY29udGVudDogdCgndnhlLnRhYmxlLmltcFN1Y2Nlc3MnLCBbcmVjb3Jkcy5sZW5ndGhdKSBhcyBzdHJpbmcsIHN0YXR1czogJ3N1Y2Nlc3MnIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcclxuICAgIH1cclxuICB9XHJcbiAgZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKVxyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVJbXBvcnRFdmVudCAocGFyYW1zOiBJbnRlcmNlcHRvckltcG9ydFBhcmFtcykge1xyXG4gIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcclxuICAgIGltcG9ydFhMU1gocGFyYW1zKVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVFeHBvcnRFdmVudCAocGFyYW1zOiBJbnRlcmNlcHRvckV4cG9ydFBhcmFtcykge1xyXG4gIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcclxuICAgIGV4cG9ydFhMU1gocGFyYW1zKVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICog5Z+65LqOIHZ4ZS10YWJsZSDooajmoLznmoTlop7lvLrmj5Lku7bvvIzmlK/mjIHlr7zlh7ogeGxzeCDmoLzlvI9cclxuICovXHJcbmV4cG9ydCBjb25zdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1ggPSB7XHJcbiAgaW5zdGFsbCAodnhldGFibGU6IHR5cGVvZiBWWEVUYWJsZSkge1xyXG4gICAgY29uc3QgeyBpbnRlcmNlcHRvciB9ID0gdnhldGFibGVcclxuICAgIHZ4ZXRhYmxlLnNldHVwKHtcclxuICAgICAgZXhwb3J0OiB7XHJcbiAgICAgICAgdHlwZXM6IHtcclxuICAgICAgICAgIHhsc3g6IDBcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICBpbnRlcmNlcHRvci5taXhpbih7XHJcbiAgICAgICdldmVudC5pbXBvcnQnOiBoYW5kbGVJbXBvcnRFdmVudCxcclxuICAgICAgJ2V2ZW50LmV4cG9ydCc6IGhhbmRsZUV4cG9ydEV2ZW50XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSAmJiB3aW5kb3cuVlhFVGFibGUudXNlKSB7XHJcbiAgd2luZG93LlZYRVRhYmxlLnVzZShWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1gpXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWFxyXG4iLCJpbXBvcnQgWEVVdGlscyBmcm9tICd4ZS11dGlscyc7XG5pbXBvcnQgKiBhcyBFeGNlbEpTIGZyb20gJ2V4Y2VsanMnO1xuY29uc3QgZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciA9ICdmOGY4ZjknO1xuY29uc3QgZGVmYXVsdENlbGxGb250Q29sb3IgPSAnNjA2MjY2JztcbmNvbnN0IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUgPSAndGhpbic7XG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yID0gJ2U4ZWFlYyc7XG5mdW5jdGlvbiBnZXRDZWxsTGFiZWwoY29sdW1uLCBjZWxsVmFsdWUpIHtcbiAgICBpZiAoY2VsbFZhbHVlKSB7XG4gICAgICAgIHN3aXRjaCAoY29sdW1uLmNlbGxUeXBlKSB7XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgIHJldHVybiBYRVV0aWxzLnRvVmFsdWVTdHJpbmcoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChjZWxsVmFsdWUubGVuZ3RoIDwgMTIgJiYgIWlzTmFOKGNlbGxWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2VsbFZhbHVlO1xufVxuZnVuY3Rpb24gZ2V0Rm9vdGVyRGF0YShvcHRzLCBmb290ZXJEYXRhKSB7XG4gICAgY29uc3QgeyBmb290ZXJGaWx0ZXJNZXRob2QgfSA9IG9wdHM7XG4gICAgcmV0dXJuIGZvb3RlckZpbHRlck1ldGhvZCA/IGZvb3RlckRhdGEuZmlsdGVyKChpdGVtcywgaW5kZXgpID0+IGZvb3RlckZpbHRlck1ldGhvZCh7IGl0ZW1zLCAkcm93SW5kZXg6IGluZGV4IH0pKSA6IGZvb3RlckRhdGE7XG59XG5mdW5jdGlvbiBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRzLCByb3dzLCBjb2x1bW4pIHtcbiAgICBjb25zdCBjZWxsVmFsdWUgPSBnZXRDZWxsTGFiZWwoY29sdW1uLCByb3dzWyR0YWJsZS5nZXRWTUNvbHVtbkluZGV4KGNvbHVtbildKTtcbiAgICByZXR1cm4gY2VsbFZhbHVlO1xufVxuZnVuY3Rpb24gZ2V0VmFsaWRDb2x1bW4oY29sdW1uKSB7XG4gICAgY29uc3QgeyBjaGlsZE5vZGVzIH0gPSBjb2x1bW47XG4gICAgY29uc3QgaXNDb2xHcm91cCA9IGNoaWxkTm9kZXMgJiYgY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgaWYgKGlzQ29sR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIGdldFZhbGlkQ29sdW1uKGNoaWxkTm9kZXNbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sdW1uO1xufVxuZnVuY3Rpb24gc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIGhlaWdodCkge1xuICAgIGlmIChoZWlnaHQpIHtcbiAgICAgICAgZXhjZWxSb3cuaGVpZ2h0ID0gWEVVdGlscy5mbG9vcihoZWlnaHQgKiAwLjc1LCAxMik7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBhbGlnbikge1xuICAgIGV4Y2VsQ2VsbC5wcm90ZWN0aW9uID0ge1xuICAgICAgICBsb2NrZWQ6IGZhbHNlXG4gICAgfTtcbiAgICBleGNlbENlbGwuYWxpZ25tZW50ID0ge1xuICAgICAgICB2ZXJ0aWNhbDogJ21pZGRsZScsXG4gICAgICAgIGhvcml6b250YWw6IGFsaWduIHx8ICdsZWZ0J1xuICAgIH07XG4gICAgZXhjZWxDZWxsLmZvbnQgPSB7XG4gICAgICAgIG5hbWU6ICdBcmlhbCcsXG4gICAgICAgIHNpemU6IDhcbiAgICB9O1xufVxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJvcmRlclN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHRvcDoge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYm90dG9tOiB7XG4gICAgICAgICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBleHBvcnRYTFNYKHBhcmFtcykge1xuICAgIGNvbnN0IG1zZ0tleSA9ICd4bHN4JztcbiAgICBjb25zdCB7ICR0YWJsZSwgb3B0aW9ucywgY29sdW1ucywgY29sZ3JvdXBzLCBkYXRhcyB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IHsgJHZ4ZSwgcm93SGVpZ2h0LCBoZWFkZXJBbGlnbjogYWxsSGVhZGVyQWxpZ24sIGFsaWduOiBhbGxBbGlnbiwgZm9vdGVyQWxpZ246IGFsbEZvb3RlckFsaWduIH0gPSAkdGFibGU7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIHNoZWV0TmFtZSwgaXNIZWFkZXIsIGlzRm9vdGVyLCBpc01lcmdlLCBpc0NvbGdyb3VwLCBvcmlnaW5hbCwgdXNlU3R5bGUsIHNoZWV0TWV0aG9kIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZTtcbiAgICBjb25zdCBtZXJnZUNlbGxzID0gJHRhYmxlLmdldE1lcmdlQ2VsbHMoKTtcbiAgICBjb25zdCBjb2xMaXN0ID0gW107XG4gICAgY29uc3QgZm9vdExpc3QgPSBbXTtcbiAgICBjb25zdCBzaGVldENvbHMgPSBbXTtcbiAgICBjb25zdCBzaGVldE1lcmdlcyA9IFtdO1xuICAgIGxldCBiZWZvcmVSb3dDb3VudCA9IDA7XG4gICAgY29uc3QgY29sSGVhZCA9IHt9O1xuICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgaWQsIHByb3BlcnR5LCByZW5kZXJXaWR0aCB9ID0gY29sdW1uO1xuICAgICAgICBjb2xIZWFkW2lkXSA9IG9yaWdpbmFsID8gcHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKTtcbiAgICAgICAgc2hlZXRDb2xzLnB1c2goe1xuICAgICAgICAgICAga2V5OiBpZCxcbiAgICAgICAgICAgIHdpZHRoOiBYRVV0aWxzLmNlaWwocmVuZGVyV2lkdGggLyA4LCAxKVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvLyDlpITnkIbooajlpLRcbiAgICBpZiAoaXNIZWFkZXIpIHtcbiAgICAgICAgLy8g5aSE55CG5YiG57uEXG4gICAgICAgIGlmIChpc0NvbGdyb3VwICYmICFvcmlnaW5hbCAmJiBjb2xncm91cHMpIHtcbiAgICAgICAgICAgIGNvbGdyb3Vwcy5mb3JFYWNoKChjb2xzLCBySW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cEhlYWQgPSB7fTtcbiAgICAgICAgICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBncm91cEhlYWRbY29sdW1uLmlkXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29scy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBfY29sU3BhbiwgX3Jvd1NwYW4gfSA9IGNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsaWRDb2x1bW4gPSBnZXRWYWxpZENvbHVtbihjb2x1bW4pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW5JbmRleCA9IGNvbHVtbnMuaW5kZXhPZih2YWxpZENvbHVtbik7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwSGVhZFt2YWxpZENvbHVtbi5pZF0gPSBvcmlnaW5hbCA/IHZhbGlkQ29sdW1uLnByb3BlcnR5IDogY29sdW1uLmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfY29sU3BhbiA+IDEgfHwgX3Jvd1NwYW4gPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOiB7IHI6IHJJbmRleCwgYzogY29sdW1uSW5kZXggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlOiB7IHI6IHJJbmRleCArIF9yb3dTcGFuIC0gMSwgYzogY29sdW1uSW5kZXggKyBfY29sU3BhbiAtIDEgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb2xMaXN0LnB1c2goZ3JvdXBIZWFkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29sTGlzdC5wdXNoKGNvbEhlYWQpO1xuICAgICAgICB9XG4gICAgICAgIGJlZm9yZVJvd0NvdW50ICs9IGNvbExpc3QubGVuZ3RoO1xuICAgIH1cbiAgICAvLyDlpITnkIblkIjlubZcbiAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICAgICAgbWVyZ2VDZWxscy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtO1xuICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcbiAgICAgICAgICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgcm93TGlzdCA9IGRhdGFzLm1hcChpdGVtID0+IHtcbiAgICAgICAgY29uc3QgcmVzdCA9IHt9O1xuICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgcmVzdFtjb2x1bW4uaWRdID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgaXRlbVtjb2x1bW4uaWRdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN0O1xuICAgIH0pO1xuICAgIGJlZm9yZVJvd0NvdW50ICs9IHJvd0xpc3QubGVuZ3RoO1xuICAgIC8vIOWkhOeQhuihqOWwvlxuICAgIGlmIChpc0Zvb3Rlcikge1xuICAgICAgICBjb25zdCB7IGZvb3RlckRhdGEgfSA9ICR0YWJsZS5nZXRUYWJsZURhdGEoKTtcbiAgICAgICAgY29uc3QgZm9vdGVycyA9IGdldEZvb3RlckRhdGEob3B0aW9ucywgZm9vdGVyRGF0YSk7XG4gICAgICAgIGNvbnN0IG1lcmdlRm9vdGVySXRlbXMgPSAkdGFibGUuZ2V0TWVyZ2VGb290ZXJJdGVtcygpO1xuICAgICAgICAvLyDlpITnkIblkIjlubZcbiAgICAgICAgaWYgKGlzTWVyZ2UgJiYgIW9yaWdpbmFsKSB7XG4gICAgICAgICAgICBtZXJnZUZvb3Rlckl0ZW1zLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtO1xuICAgICAgICAgICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxuICAgICAgICAgICAgICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZvb3RlcnMuZm9yRWFjaCgocm93cykgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHt9O1xuICAgICAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICBpdGVtW2NvbHVtbi5pZF0gPSBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRpb25zLCByb3dzLCBjb2x1bW4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb290TGlzdC5wdXNoKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgZXhwb3J0TWV0aG9kID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB3b3JrYm9vayA9IG5ldyBFeGNlbEpTLldvcmtib29rKCk7XG4gICAgICAgIGNvbnN0IHNoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KHNoZWV0TmFtZSk7XG4gICAgICAgIHdvcmtib29rLmNyZWF0b3IgPSAndnhlLXRhYmxlJztcbiAgICAgICAgc2hlZXQuY29sdW1ucyA9IHNoZWV0Q29scztcbiAgICAgICAgaWYgKGlzSGVhZGVyKSB7XG4gICAgICAgICAgICBzaGVldC5hZGRSb3dzKGNvbExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgaGVhZGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgaGVhZGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsSGVhZGVyQWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnQXJpYWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2xkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3BhdHRlcm4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiAnc29saWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmZ0NvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzaGVldC5hZGRSb3dzKHJvd0xpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdBcmlhbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlzRm9vdGVyKSB7XG4gICAgICAgICAgICBzaGVldC5hZGRSb3dzKGZvb3RMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW4gPSAkdGFibGUuZ2V0Q29sdW1uQnlJZChleGNlbENvbC5rZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGZvb3RlckFsaWduLCBhbGlnbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGZvb3RlckFsaWduIHx8IGFsaWduIHx8IGFsbEZvb3RlckFsaWduIHx8IGFsbEFsaWduKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0FyaWFsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXNlU3R5bGUgJiYgc2hlZXRNZXRob2QpIHtcbiAgICAgICAgICAgIGNvbnN0IHNQYXJhbXMgPSB7IG9wdGlvbnM6IG9wdGlvbnMsIHdvcmtib29rLCB3b3Jrc2hlZXQ6IHNoZWV0LCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzLCAkdGFibGUgfTtcbiAgICAgICAgICAgIHNoZWV0TWV0aG9kKHNQYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIHNoZWV0TWVyZ2VzLmZvckVhY2goKHsgcywgZSB9KSA9PiB7XG4gICAgICAgICAgICBzaGVldC5tZXJnZUNlbGxzKHMuciArIDEsIHMuYyArIDEsIGUuciArIDEsIGUuYyArIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgd29ya2Jvb2sueGxzeC53cml0ZUJ1ZmZlcigpLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyB9KTtcbiAgICAgICAgICAgIC8vIOWvvOWHuiB4bHN4XG4gICAgICAgICAgICBkb3dubG9hZEZpbGUocGFyYW1zLCBibG9iLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UobXNnS2V5KTtcbiAgICAgICAgICAgICAgICBtb2RhbC5tZXNzYWdlKHsgY29udGVudDogdCgndnhlLnRhYmxlLmV4cFN1Y2Nlc3MnKSwgc3RhdHVzOiAnc3VjY2VzcycgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcbiAgICAgICAgbW9kYWwubWVzc2FnZSh7IGlkOiBtc2dLZXksIGNvbnRlbnQ6IHQoJ3Z4ZS50YWJsZS5leHBMb2FkaW5nJyksIHN0YXR1czogJ2xvYWRpbmcnLCBkdXJhdGlvbjogLTEgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoZXhwb3J0TWV0aG9kLCAxNTAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV4cG9ydE1ldGhvZCgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7ICR0YWJsZSB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IHsgJHZ4ZSB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGU7XG4gICAgY29uc3QgeyBtZXNzYWdlLCBmaWxlbmFtZSwgdHlwZSB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2U7XG4gICAgaWYgKHdpbmRvdy5CbG9iKSB7XG4gICAgICAgIGlmIChuYXZpZ2F0b3IubXNTYXZlQmxvYikge1xuICAgICAgICAgICAgbmF2aWdhdG9yLm1zU2F2ZUJsb2IoYmxvYiwgYCR7ZmlsZW5hbWV9LiR7dHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmtFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgbGlua0VsZW0udGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgICAgICAgICBsaW5rRWxlbS5kb3dubG9hZCA9IGAke2ZpbGVuYW1lfS4ke3R5cGV9YDtcbiAgICAgICAgICAgIGxpbmtFbGVtLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rRWxlbSk7XG4gICAgICAgICAgICBsaW5rRWxlbS5jbGljaygpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsaW5rRWxlbSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChzaG93TXNnICYmIG1vZGFsKSB7XG4gICAgICAgICAgICBtb2RhbC5hbGVydCh7IGNvbnRlbnQ6IHQoJ3Z4ZS5lcnJvci5ub3RFeHAnKSwgc3RhdHVzOiAnZXJyb3InIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gY2hlY2tJbXBvcnREYXRhKHRhYmxlRmllbGRzLCBmaWVsZHMpIHtcbiAgICByZXR1cm4gZmllbGRzLnNvbWUoZmllbGQgPT4gdGFibGVGaWVsZHMuaW5kZXhPZihmaWVsZCkgPiAtMSk7XG59XG5mdW5jdGlvbiBpbXBvcnRFcnJvcihwYXJhbXMpIHtcbiAgICBjb25zdCB7ICR0YWJsZSwgb3B0aW9ucyB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IHsgJHZ4ZSwgX2ltcG9ydFJlamVjdCB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlO1xuICAgIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGU7XG4gICAgaWYgKHNob3dNc2cgJiYgbW9kYWwpIHtcbiAgICAgICAgbW9kYWwubWVzc2FnZSh7IGNvbnRlbnQ6IHQoJ3Z4ZS5lcnJvci5pbXBGaWVsZHMnKSwgc3RhdHVzOiAnZXJyb3InIH0pO1xuICAgIH1cbiAgICBpZiAoX2ltcG9ydFJlamVjdCkge1xuICAgICAgICBfaW1wb3J0UmVqZWN0KHsgc3RhdHVzOiBmYWxzZSB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiBpbXBvcnRYTFNYKHBhcmFtcykge1xuICAgIGNvbnN0IHsgJHRhYmxlLCBjb2x1bW5zLCBvcHRpb25zLCBmaWxlIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVzb2x2ZSB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGU7XG4gICAgY29uc3Qgc2hvd01zZyA9IG9wdGlvbnMubWVzc2FnZSAhPT0gZmFsc2U7XG4gICAgY29uc3QgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgZmlsZVJlYWRlci5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpO1xuICAgIH07XG4gICAgZmlsZVJlYWRlci5vbmxvYWQgPSAoZXZudCkgPT4ge1xuICAgICAgICBjb25zdCB0YWJsZUZpZWxkcyA9IFtdO1xuICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGQgPSBjb2x1bW4ucHJvcGVydHk7XG4gICAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgICAgICB0YWJsZUZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKTtcbiAgICAgICAgY29uc3QgcmVhZGVyVGFyZ2V0ID0gZXZudC50YXJnZXQ7XG4gICAgICAgIGlmIChyZWFkZXJUYXJnZXQpIHtcbiAgICAgICAgICAgIHdvcmtib29rLnhsc3gubG9hZChyZWFkZXJUYXJnZXQucmVzdWx0KS50aGVuKHdiID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdFNoZWV0ID0gd2Iud29ya3NoZWV0c1swXTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RTaGVldCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzaGVldFZhbHVlcyA9IGZpcnN0U2hlZXQuZ2V0U2hlZXRWYWx1ZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRJbmRleCA9IFhFVXRpbHMuZmluZEluZGV4T2Yoc2hlZXRWYWx1ZXMsIChsaXN0KSA9PiBsaXN0ICYmIGxpc3QubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IHNoZWV0VmFsdWVzW2ZpZWxkSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBjaGVja0ltcG9ydERhdGEodGFibGVGaWVsZHMsIGZpZWxkcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY29yZHMgPSBzaGVldFZhbHVlcy5zbGljZShmaWVsZEluZGV4KS5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3QuZm9yRWFjaCgoY2VsbFZhbHVlLCBjSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVtmaWVsZHNbY0luZGV4XV0gPSBjZWxsVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjb3JkID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFibGVGaWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29yZFtmaWVsZF0gPSBYRVV0aWxzLmlzVW5kZWZpbmVkKGl0ZW1bZmllbGRdKSA/IG51bGwgOiBpdGVtW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGFibGUuY3JlYXRlRGF0YShyZWNvcmRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvYWRSZXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm1vZGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRSZXN0ID0gJHRhYmxlLmluc2VydEF0KGRhdGEsIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRSZXN0ID0gJHRhYmxlLnJlbG9hZERhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2FkUmVzdC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9pbXBvcnRSZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0UmVzb2x2ZSh7IHN0YXR1czogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd01zZyAmJiBtb2RhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBjb250ZW50OiB0KCd2eGUudGFibGUuaW1wU3VjY2VzcycsIFtyZWNvcmRzLmxlbmd0aF0pLCBzdGF0dXM6ICdzdWNjZXNzJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmaWxlUmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xufVxuZnVuY3Rpb24gaGFuZGxlSW1wb3J0RXZlbnQocGFyYW1zKSB7XG4gICAgaWYgKHBhcmFtcy5vcHRpb25zLnR5cGUgPT09ICd4bHN4Jykge1xuICAgICAgICBpbXBvcnRYTFNYKHBhcmFtcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5mdW5jdGlvbiBoYW5kbGVFeHBvcnRFdmVudChwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XG4gICAgICAgIGV4cG9ydFhMU1gocGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbi8qKlxuICog5Z+65LqOIHZ4ZS10YWJsZSDooajmoLznmoTlop7lvLrmj5Lku7bvvIzmlK/mjIHlr7zlh7ogeGxzeCDmoLzlvI9cbiAqL1xuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWCA9IHtcbiAgICBpbnN0YWxsKHZ4ZXRhYmxlKSB7XG4gICAgICAgIGNvbnN0IHsgaW50ZXJjZXB0b3IgfSA9IHZ4ZXRhYmxlO1xuICAgICAgICB2eGV0YWJsZS5zZXR1cCh7XG4gICAgICAgICAgICBleHBvcnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgICAgICAgICB4bHN4OiAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJjZXB0b3IubWl4aW4oe1xuICAgICAgICAgICAgJ2V2ZW50LmltcG9ydCc6IGhhbmRsZUltcG9ydEV2ZW50LFxuICAgICAgICAgICAgJ2V2ZW50LmV4cG9ydCc6IGhhbmRsZUV4cG9ydEV2ZW50XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LlZYRVRhYmxlICYmIHdpbmRvdy5WWEVUYWJsZS51c2UpIHtcbiAgICB3aW5kb3cuVlhFVGFibGUudXNlKFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWCk7XG59XG5leHBvcnQgZGVmYXVsdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1g7XG4iXX0=
