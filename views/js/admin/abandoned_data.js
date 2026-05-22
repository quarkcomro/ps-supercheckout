/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * This file is added by Anshul to show the Abandoned cart checkout data. It basically shows the number of abandoned carts, number of ordered carts, abandoned revenues, 
 * checkout conversion & ordered revenues day/week/month/year wise. It also shows the graph for the same.
 * Feature:Abcart Stats (Jan 2020)
 */

$(document).ready(function () {
    if (typeof conversion_data_graph != 'undefined' && conversion_data_graph != "") {
        conversion_data_graph = JSON.parse(conversion_data_graph);
        getAConversionLineGraph('ab_checkout_conversion_count');
    }

    if (typeof ac_complete_data_graph != 'undefined' && ac_complete_data_graph != "") {
        ac_complete_data_graph = JSON.parse(ac_complete_data_graph);
        getAcCompleteDataLineGraph('ab_cart_count_graph_revenue');
        getAcCompleteDataLineGraph('ab_cart_count_graph_numbers');
    }

    $('#abandoned_data_track_from_date').datepicker({dateFormat: 'dd-mm-yy'});
    $('#abandoned_data_track_to_date').datepicker({dateFormat: 'dd-mm-yy'});
});

/*
 * Show the graph data for revenue, number of abandoned cart & ordered carts
 */
function getAcCompleteDataLineGraph(placeholder) {
    var data_conversion_ac = [];
    var data_conversion_ar = [];
    var data_conversion_oc = [];
    var data_conversion_or = [];
    var tickss = [];

    for (var i in ac_complete_data_graph)
    {
        if (placeholder == 'ab_cart_count_graph_revenue') {
            tickss.push([i, ac_complete_data_graph[i][0]]);
            data_conversion_ar.push([i, ac_complete_data_graph[i][2]]);
            data_conversion_or.push([i, ac_complete_data_graph[i][4]]);
            var dataset = [
                {
                    label: data_conversion_ar_text,
                    data: data_conversion_ar,
                    points: {fillColor: "#fbbb22", show: true},
                    lines: {show: true, fillColor: '#fbbb22'}
                },
                {
                    label: data_conversion_or_text,
                    data: data_conversion_or,
                    points: {fillColor: "#fbbb22", show: true},
                    lines: {show: true, fillColor: '#fbbb22'}
                }
            ];
        } else if (placeholder == 'ab_cart_count_graph_numbers') {
            tickss.push([i, ac_complete_data_graph[i][0]]);
            data_conversion_ac.push([i, ac_complete_data_graph[i][1]]);
            data_conversion_oc.push([i, ac_complete_data_graph[i][3]]);
            var dataset = [
                {
                    label: data_conversion_ac_text,
                    data: data_conversion_ac,
                    points: {fillColor: "#fbbb22", show: true},
                    lines: {show: true, fillColor: '#fbbb22'}
                },
                {
                    label: data_conversion_oc_text,
                    data: data_conversion_oc,
                    points: {fillColor: "#fbbb22", show: true},
                    lines: {show: true, fillColor: '#fbbb22'}
                },
            ];
        }
    }

    var options = {
        series: {
            lines: {
                show: true
            },
            points: {
                radius: 3,
                fill: true,
                show: true
            }
        },
        xaxis: {
            ticks: tickss,
            axisLabel: "Time",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial',
            axisLabelPadding: 10
        },
        yaxes: [{
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 3,
            }, {
                position: "right",
                axisLabel: "Change",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 3
            }
        ],
        legend: {
//                backgroundColor:"#fbbb22"
//                noColumns: 0,
//                labelBoxBorderColor: "#000000",
            position: "nw"
        },
        grid: {
            hoverable: true,
            borderWidth: 2,
            borderColor: "#633200",
//                backgroundColor: {colors: ["#ffffff", "#EDF5FF"]}
        },
//            colors: ["#FF0000", "#0022FF"]
    };
    $.plot($('#' + placeholder), dataset, options);
    $('#' + placeholder).UseTooltip(placeholder);
}

/*
 * Show the graph data for conversion of number of abandoned cart & ordered carts
 */
function getAConversionLineGraph(placeholder) {
    var data_conversion = [];
    var tickss = [];

    for (var i in conversion_data_graph)
    {
        tickss.push([i, conversion_data_graph[i][0]]);
        data_conversion.push([i, conversion_data_graph[i][1]]);
    }

    var dataset = [
        {
            label: checkout_conversion_text,
            data: data_conversion,
            points: {fillColor: "#fbbb22", show: true},
            lines: {show: true, fillColor: '#fbbb22'}
        }
    ];

    var options = {
        series: {
            lines: {
                show: true
            },
            points: {
                radius: 3,
                fill: true,
                show: true
            }
        },
        xaxis: {
            ticks: tickss,
            axisLabel: "Time",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial',
            axisLabelPadding: 10
        },
        yaxes: [{
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 3,
            }, {
                position: "right",
                axisLabel: "Change",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 3
            }
        ],
        legend: {
//                backgroundColor:"#fbbb22"
//                noColumns: 0,
//                labelBoxBorderColor: "#000000",
//                position: "nw"
        },
        grid: {
            hoverable: true,
            borderWidth: 2,
            borderColor: "#633200",
//                backgroundColor: {colors: ["#ffffff", "#EDF5FF"]}
        },
//            colors: ["#FF0000", "#0022FF"]
    };
    $.plot($('#' + placeholder), dataset, options);
    $('#' + placeholder).UseTooltip(placeholder);
}

/*Function called to execute filter on clicking the apply button after selecting the custom date*/
function selectFilter(type) {
    if (type == 'reset') {
        window.location.href = kb_controller_name;
        return false;
    }
    $('#ac_filter_format').val(type);
    let url = kb_controller_name + '&abandoned_data_track_from_date=' + $('#abandoned_data_track_from_date').val() + '&abandoned_data_track_to_date=' + $('#abandoned_data_track_to_date').val() + '&ac_filter_format=' + type + '&abandoned_data_filter=1';
    window.location.href = url;
}


/*Function defined to show the data on hover the points in graph*/
var previousPoint = null, previousLabel = null;
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
$.fn.UseTooltip = function (placeholder) {
    $(this).bind("plothover", function (event, pos, item) {
        if (item) {
            if ((previousLabel != item.series.label) || (previousPoint != item.dataIndex)) {
                previousPoint = item.dataIndex;
                previousLabel = item.series.label;
                $("#tooltip").remove();

                var x = item.datapoint[0];
                var y = item.datapoint[1];

                var color = item.series.color;
                var month = new Date(x).getMonth();
                if (placeholder == 'ab_checkout_conversion_count') {
                    showTooltip(item.pageX,
                            item.pageY,
                            color,
                            "<strong>" + item.series.xaxis.ticks[x].label + " - " + item.series.label + "</strong><br><strong>" + y + "% </strong>");
                } else if (placeholder == 'ab_cart_count_graph_revenue') {
                    showTooltip(item.pageX,
                            item.pageY,
                            color,
                            "<strong>" + item.series.xaxis.ticks[x].label + " - " + item.series.label + "</strong><br><strong>" + current_currency_sign + " " + y + " </strong>");
                } else if (placeholder == 'ab_cart_count_graph_numbers') {
                    showTooltip(item.pageX,
                            item.pageY,
                            color,
                            "<strong>" + item.series.xaxis.ticks[x].label + " - " + item.series.label + "</strong><br><strong>" + y + " </strong>");
                } else {
                    if (item.seriesIndex == 0) {
                        showTooltip(item.pageX,
                                item.pageY,
                                color,
                                "<strong>" + item.series.xaxis.ticks[x].label + " " + item.series.label + "</strong><br><strong>" + y + "</strong>");
                    } else {
                        showTooltip(item.pageX,
                                item.pageY,
                                color,
                                "<strong>" + item.series.xaxis.ticks[x].label + " " + item.series.label + "</strong><br><strong>" + y + "</strong>");
                    }
                }
            }
        } else {
            $("#tooltip").remove();
            previousPoint = null;
        }
    });
};
function gd(year, month, day) {
    return new Date(year, month, day).getTime();
}


function showTooltip(x, y, color, contents) {
    $('<div id="tooltip">' + contents + '</div>').css({
        position: 'absolute',
        display: 'none',
        top: y - 40,
        left: x - 120,
        border: '2px solid ' + color,
        padding: '3px',
        'font-size': '9px',
        'border-radius': '5px',
        'background-color': '#fff',
        'font-family': 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
        opacity: 0.9
    }).appendTo("body").fadeIn(200);
}