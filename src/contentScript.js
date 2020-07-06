//contentScript.js
const html = `<div class="py-2 pl-3 controls-container" style="width:150px;">
                <div class="estimated-container">   
                    <select class="form-select select-sm d-block estimated" style="width:120px;" title="Estimated Time">
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
                <div class="done-container mt-1">
                    <select class="form-select select-sm d-block done"  style="width:120px;" title="% Done">
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

const issuesEnhancer = {
    token: null,
    username: null,
    repository: null,
    displayOverview: true,
    displayEstimatedTime: true,
    displayDone: true,
    getIssueId($issueRow) {
        const arr = $issueRow.attr('id').split("_");
        if (arr.length == 2)
            return arr[1];

        return null;
    },
    async getIssueMetadata($issueRow) {
        const issueId = this.getIssueId($issueRow);
        if (issueId == null)
            return;

        const data = await this.getIssue(issueId);
        const metadata = this.parseBody(data.body);


        //Fill data
        $issueRow.data('issueId', issueId);
        $issueRow.data('body', data.body);
        $issueRow.data('metadata', metadata);

        this.calculateTotals();

        // Fill controls
        $issueRow.find(".estimated").val(metadata.estimated);
        $issueRow.find(".done").val(metadata.done);
    },
    parseBody(body) {
        const $wrapper = $("<div></div>").append(body);

        let metadata = null;

        $wrapper.contents().filter(function () {
            return this.nodeType == 8 && this.nodeValue.startsWith("GitHubIssuesEnhancements=");
        }).each(function (i, e) {
            const json = e.nodeValue.replace("GitHubIssuesEnhancements=", "").trim();
            try {
                obj = JSON.parse(json);
                metadata = {
                    ...{
                        estimated: '',
                        done: '0'
                    }, ...obj
                };
            } catch (e) {
                console.log(e);
            }
        });

        if (metadata == null) {
            metadata = {estimated: '', done: '0'}
            $wrapper.append('\n\n\n<!--GitHubIssuesEnhancements={"estimated":"", "done":"0"}-->')
        }

        return metadata;
    },
    setIssueMetadata($issueRow) {
        const issueId = $issueRow.data("issueId");
        const body = $issueRow.data("body");
        const metadata = $issueRow.data("metadata");

        const $wrapper = $("<div></div>").append(body);

        let found = false;
        $wrapper.contents().filter(function () {
            return this.nodeType == 8 && this.nodeValue.startsWith("GitHubIssuesEnhancements=");
        }).each(function (i, e) {
            found = true;
            e.nodeValue = "GitHubIssuesEnhancements=" + JSON.stringify(metadata);
        });

        if (!found)
            $wrapper.append('\n\n\n<!--GitHubIssuesEnhancements={"estimated":"", "done":"0"}-->')

        this.updateIssue(issueId, $wrapper.html());
        this.calculateTotals();
    },
    async getIssue(id) {
        let result = null;
        const self = this;
        try {
            result = await $.ajax({
                url: `https://api.github.com/repos/${self.username}/${self.repository}/issues/${id}`,
                dataType: 'json',
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "token " + self.token);
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
    },
    updateIssue(id, body) {
        const self = this;
        $.ajax({
            url: `https://api.github.com/repos/${self.username}/${self.repository}/issues/${id}`,
            type: "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "token " + self.token);
            },
            data: JSON.stringify({
                body: body
            })
        })
    },
    calculateTotals() {
        estimatedTotal = 0;
        estimatedDone = 0;

        var fnHR = function (value) {
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

            if (result.length == 0)
                return "(none)";
            else
                return result.join(" ")
        }

        $(".js-issue-row").each(function (index) {
            const $this=$(this);
            const metadata = $this.data('metadata');

            if (metadata != null) {
                estimatedDone += parseInt(metadata.done);

                if (metadata.estimated!='')
                    $this.find(".estimated").css({"background-color":"#E1EFFF","border-color":"#2B9FFF", "box-shadow":"none"})
                else
                    $this.find(".estimated").css({"background-color":"","border-color":"", "color":"", "box-shadow":""})

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

        const percent = (estimatedDone / $(".js-issue-row").length);
        const html = `<div><b>Estimated</b></div>
                <div>${fnHR(estimatedTotal)}</div>
                <div class="mt-2"><b>Done</b></div>
                <div>${percent.toFixed(0)}%</div>
                <div class="progress-bar progress-bar-small"><span class="progress" style="width: ${percent}%">&nbsp;</span></div>`

        $(".estimated-totals").html(html);
    },
    init() {
        const self = this;
        const htmlOverview = $(`<div class="estimated-time-overview">
                            <div class="d-flex flex-column col-12 col-sm-3 p-2 border border-gray-dark rounded-1 mb-3 mt-3" style="margin-left: auto">
                                   <!--<div class="mb-3"><h4>GitHub Issues Enhancements</h4></div>-->
                                   <div class="estimated-totals mb-2"></div>
                                   <div><input type="checkbox" id="displayEstimatedTime"> <label for="displayEstimatedTime">Show estimated time</label></div>
                                   <div><input type="checkbox" id="displayDone"> <label for="displayDone">Show % done</label></div>
                            </div>
                       </div>`);

        if (!self.displayOverview) htmlOverview.addClass("d-none");

        $('.repository-content .Box').before(htmlOverview);
        //$('.repository-content .Box .Box-header').append('<div style="width: 150px;"></div>');

        $(".js-issue-row").each(function (index) {
            const $this = $(this);
            const $controls = $(html);

            $(".controls-container", $controls).toggleClass("d-none", !self.displayDone && !self.displayEstimatedTime);
            $(".estimated-container", $controls).toggleClass("d-none", !self.displayEstimatedTime);
            $(".done-container", $controls).toggleClass("d-none", !self.displayDone);

            $this.find(".Box-row--drag-hide").append($controls);
            self.getIssueMetadata($this);
        });

        $("#displayDone, #displayEstimatedTime").change(function () {
            chrome.storage.sync.set({
                "displayEstimatedTime": $("#displayEstimatedTime").prop('checked'),
                "displayDone": $("#displayDone").prop('checked')
            }, function () {
                if (chrome.runtime.error) {
                    console.log("Runtime error");
                }
            });

            $(".controls-container").toggleClass("d-none", (!$("#displayDone").prop('checked') && !$("#displayEstimatedTime").prop('checked')));
            $(".estimated-container").toggleClass("d-none", (!$("#displayEstimatedTime").prop('checked')));
            $(".done-container").toggleClass("d-none", (!$("#displayDone").prop('checked')));
        });


        $(".estimated").change(function (e) {
            const $this = $(this);
            const $issueRow = $this.closest(".js-issue-row");
            const metadata = $issueRow.data("metadata");

            metadata.estimated = $this.val()
            self.setIssueMetadata($issueRow);
        });

        $(".done").change(function (e) {
            const $this = $(this);
            const $issueRow = $this.closest(".js-issue-row");
            const metadata = $issueRow.data("metadata");

            metadata.done = $this.val()
            self.setIssueMetadata($issueRow);
        });
    },
    beforeInit() {
        const self = this;
        const arr = window.location.pathname.split("/");

        if (arr.length < 3) return;
        this.username = arr[1];
        this.repository = arr[2];

        // Read it using the storage API
        chrome.storage.sync.get(['personalAccessToken', 'displayOverview', 'displayEstimatedTime', 'displayDone'], function (items) {
            self.token = items.personalAccessToken;
            self.displayDone = items.displayDone;
            self.displayEstimatedTime = items.displayEstimatedTime;
            self.displayOverview = items.displayOverview;
            self.init();

            $("#displayDone").prop('checked', self.displayDone)
            $("#displayEstimatedTime").prop('checked', self.displayEstimatedTime);
        });
    }
}

issuesEnhancer.beforeInit();