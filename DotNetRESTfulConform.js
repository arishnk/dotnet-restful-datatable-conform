/*
- This will process incoming DotNet RESTful JSON into a form DataTables likes
- It will pass over the datatable paging size so we know how many records to bring back.
- aElements is an array of arrays each "row" is defined as:
  clientSideFiltering: Turns on JS client-side filtering.
  [displayColumn, displayType, linkPrefix, linkData, linkAppendYear, linkTargetBlank, orderByThis]
    displayColumn:    JSON property(s) to display in this column. Multiple columns separated by spaces and may include a comma followed by space as an additional separator for display.
    displayType:      'LINK', 'EMAIL', 'DATE', 'STRING'.
    linkPrefix:       If displayType='LINK' this is the first part of link to build. Example '/this?id='.
    linkData:         If displayType='LINK' this is the JSON property to use to complete the link.
    linkAppendYear:   Boolean. If true and displayType='LINK' add year= to the link.
    linkTargetBlank:  Boolean. If true and displayType='LINK' add target='_blank' to the A tag.
    orderByThis:      If specified order by a different column than specified in displayColumn.
*/
conformToDatatable = function (aElements, clientSideFiltering) {
    if (clientSideFiltering === undefined) clientSideFiltering = false;
    return function (sSource, aoData, fnCallback, oSettings) {
        $.ajax({
            dataType: "json",
            cache: false,
            url: sSource,
            data: !clientSideFiltering ? { //If we're doing serverside then send pertinent data...
                "page": 1,
                "pageSize": oSettings._iDisplayLength + 1,

                //If we specified a 7th element in the 2nd dimension of aElement[][] then what we have a is an explicit sort field for that column.
                "orderBy": aElements[oSettings.aaSorting[0][0]][6] !== undefined ? aElements[oSettings.aaSorting[0][0]][6] : aElements[oSettings.aaSorting[0][0]][0],

                "orderByDirection": oSettings.aaSorting[0][1],
                "filter": oSettings.oPreviousSearch.sSearch
            } : {},
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", APIToken);
            },
            success: function (json) {

                var a = [];

                for (var i = 1, iLen = json.length ; i <= iLen ; i++) {
                    var inner = [];
                    for (var j = 0, jLen = aElements.length ; j < jLen ; j++) {
                        var subCol = aElements[j][0].split(' ');
                        var toPush = [];
                        for (var k = 0, kLen = subCol.length ; k < kLen ; k++) {
                            toPush += json[i - 1][subCol[k].replace(',', '')] + (subCol[k].indexOf(',') != -1 ? ', ' : ' ');
                        }
                        switch (aElements[j][1]) {
                            case 'LINK':
                                inner.push("<a" + (aElements[oSettings.aaSorting[0][0]][5] ? " target='_blank'" : "") + " href='" + aElements[j][2] + json[i - 1][aElements[j][3]] + (theYear !== 0 && aElements[oSettings.aaSorting[0][0]][4] ? "&year=" + theYear : "") + "'>" + toPush + "</a>");
                                break;
                            case 'EMAIL':
                                inner.push("<a href='mailto:" + toPush + "'>" + toPush + "</a>");
                                break;
                            case 'DATE':
                                inner.push(toPush.substr(5, 2) + '/' + toPush.substr(8, 2) + '/' + toPush.substr(0, 4));
                                break;
                            case 'STRING':
                                inner.push(toPush);
                                break;
                        }
                    }
                    a.push(inner);
                }

                json.iTotalDisplayRecords = json.length - 1;
                if (json.length < oSettings._iDisplayLength - 1) {
                    json.iTotalRecords = json.length;
                }

                //If client-side filtering is enabled and the user is typing then filter...

                if (clientSideFiltering && oSettings.oPreviousSearch.sSearch != '') {
                    var keywords = oSettings.oPreviousSearch.sSearch.split(' ');
                    a = $.grep(a, $.proxy(/./.test, new RegExp(keywords, 'i')));
                }

                json.aaData = a;

                fnCallback(json);

            },
            error: function (jqXHR, textStatus, errorThrown) {

                console.error('Could not load data.');

            }
        });

    }
}
