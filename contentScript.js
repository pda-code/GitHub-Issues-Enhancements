//contentScript.js
const token = "08466fb6e7ba5645945bed70f2fd8bc9d943be92";

async function getIssueMetadata($issueRow) {
    const issueId = $issueRow.attr('id').split("_")[1];
    const data = await getIssue(issueId);
    const metadata = parseBody(data.body);

    $issueRow.data('issueId', issueId);
    $issueRow.data('body', data.body);
    $issueRow.data('metadata', metadata);

    calculateTotals();

    $issueRow.find(".estimated").val(metadata.estimated);
    $issueRow.find(".done").val(metadata.done);
}

function parseBody(body) {
    const $wrapper = $("<div></div>").append(body);
    let $text = $wrapper.find("#issue-metadata");
    if ($text.length == 0) {
        $wrapper.append("\n\n\n<!-- Issue Metadata -->\n")
        $text = $('<input id="issue-metadata" type="hidden">').appendTo($wrapper);
    }

    let initialMeta = {
        estimated: '',
        done: '0'
    };

    try {
        obj = JSON.parse($text.val());
        initialMeta = {...initialMeta, ...obj};
    } catch (e) {

    }

    return initialMeta;
}

function setIssueMetadata($issueRow) {
    const issueId = $issueRow.data("issueId");
    const body = $issueRow.data("body");
    const metadata = $issueRow.data("metadata");

    const $wrapper = $("<div></div>").append(body);
    let $text = $wrapper.find("#issue-metadata");
    if ($text.length == 0) {
        $wrapper.append("\n\n\n<!-- Issue Metadata -->\n")
        $text = $('<input id="issue-metadata" type="hidden">').appendTo($wrapper);
    }

    $text.attr("value", JSON.stringify(metadata));
    updateIssue(issueId, $wrapper.html());
    calculateTotals();
}

async function getIssue(id) {
    let result = null;

    try {
        result = await $.ajax({
            url: 'https://api.github.com/repos/RFAssurance/TechInsights3/issues/' + id,
            dataType: 'json',
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "token " + token);
            },
            success: function (data) {
                //console.log(data);
            },
            error: function (data) {
                //console.log(data);
            }
        });
    } catch (e) {
        console.log(e);
    }

    return result;
}

function updateIssue(id, body) {
    $.ajax({
        url: "https://api.github.com/repos/RFAssurance/TechInsights3/issues/" + id,
        type: "POST",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "token " + token);
        },
        data: JSON.stringify({
            body: body
        })
    })
}


function calculateTotals() {
    estimatedTotal = 0;
    estimatedDone = 0;

    var fnHR=function(value) {
        var units = {
            "year": 8 * 5 * 4 * 12,
            "month": 8 * 5 * 4,
            "week": 8 * 5,
            "day": 8,
            "hour": 1
        }

        var result = []

        for (var name in units) {
            var p = Math.floor(value / units[name]);
            if (p == 1) result.push(p + " " + name);
            if (p >= 2) result.push(p + " " + name + "s");
            value %= units[name]
        }

        return result;
    }

    $(".js-issue-row").each(function (index) {
        const metadata = $(this).data('metadata');
        if (metadata !=null) {
            estimatedDone += parseInt(metadata.done);
            const arr = metadata.estimated.split("-");
            let number = parseInt(arr[0]);
            const numberType = arr[1];

            switch (numberType) {
                case 'hour':
                    estimatedTotal += number;
                    break
                case 'day':
                    estimatedTotal += number * 8;
                    break
                case 'week':
                    estimatedTotal += number * 40;
                    break
                case 'month':
                    estimatedTotal += number * 40 * 4;
                    break
            }
        }
    });

    const percent=(estimatedDone/$(".js-issue-row").length);
    const html=`<div><b>Estimated</b></div>
                <div>${fnHR(estimatedTotal).join(" ")}</div>
                <div class="mt-2"><b>Done</b></div>
                <div>${percent.toFixed(0)}%</div>
                <div class="progress-bar progress-bar-small"><span class="progress" style="width: ${percent}%">&nbsp;</span></div>`

    $(".estimated-totals").html(html);
}

const html = `
            <div class="py-2 pl-3" style="width:150px;">
                <div class="mb-1">
                    <select class="form-control input-sm d-block estimated" style="width:120px;" title="Estimated Time">
                    <option value="">(none)</option>
                      <optgroup label="Hours">
                        <option value="1-hour">1 Hour </option>
                        <option value="2-hour">2 Hours</option>
                        <option value="3-hour">3 Hours</option>
                        <option value="4-hour">4 Hours</option>
                        <option value="5-hour">5 Hours</option>
                        <option value="6-hour">6 Hours</option>
                        <option value="7-hour">7 Hours</option>
                        <option value="8-hour">8 Hours</option>                      
                      </optgroup>
                      <optgroup label="Days">
                        <option value="1-day">1 Day </option>
                        <option value="2-day">2 Days</option>
                        <option value="3-day">3 Days</option>
                        <option value="4-day">4 Days</option>
                        <option value="5-day">5 Days</option>
                      </optgroup>
                      <optgroup label="Weeks">
                        <option value="1-week">1 Week </option>
                        <option value="2-week">2 Weeks</option>
                        <option value="3-week">3 Weeks</option>
                        <option value="4-week">4 Weeks</option>
                      </optgroup>
                      <optgroup label="Months">
                        <option value="1-month">1 Month </option>
                        <option value="2-month">2 Months</option>
                      </optgroup>                      
                    </select>                
                </div>
                <div>
                    <select class="form-control input-sm d-block done"  style="width:120px;" title="% Done">
                        <option value="0">0%</option>
                        <option value="10">10%</option>
                        <option value="20">20%</option>
                        <option value="30">30%</option>
                        <option value="40">40%</option>
                        <option value="50">50%</option>
                        <option value="60">60%</option>
                        <option value="70">70%</option>
                        <option value="80">80%</option>
                        <option value="90">90%</option>
                        <option value="100">100%</option>
                    </select>
                </div>
            </div>`;

const html2 = `<div><div class="d-flex flex-column col-12 col-sm-3 p-2 border border-gray-dark rounded-1 mb-3 mt-3 estimated-totals" style="margin-left: auto"></div></div>`;

$('.repository-content .Box').before(html2);
//$('.repository-content .Box .Box-header').append('<div style="width: 150px;"></div>');

$(".js-issue-row").each(function (index) {
    const $this = $(this);
    $this.find(" .Box-row--drag-hide").append(html);
    getIssueMetadata($this);
});



$(".estimated").change(function (e) {
    const $this = $(this);
    const $issueRow = $this.closest(".js-issue-row");
    const metadata = $issueRow.data("metadata");

    metadata.estimated = $this.val()
    setIssueMetadata($issueRow);
});

$(".done").change(function (e) {
    const $this = $(this);
    const $issueRow = $this.closest(".js-issue-row");
    const metadata = $issueRow.data("metadata");

    metadata.done = $this.val()
    setIssueMetadata($issueRow);
});
