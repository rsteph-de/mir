(function ($) {
    $(document).ready(function () {

        if ($(".sherpa-issn").length > 0) {
            $(".sherpa-issn").each(function () {
                getSherpaIssn($(this));
            });
        }

//--- in metadata view the select/video controller
        // on start load the first source


        var videoChooserElement = $("#videoChooser");


        $(".mir-player video, .mir-player audio").ready(function () {

            let options = videoChooserElement.find("option");
            if(options.length===1){
                videoChooserElement.hide();
            } else {
                options.filter("[data-is-main-doc=true]").first().prop("selected",true);
            }

            videoChooserElement.change();
        });

        //get all sources of selected item in a var and give it to player
        var hidePlayer = function (player) {
            if (typeof player !== "undefined") {
                player.hide();
                player.pause();
            }
        };

        let sourceCache = {};

        let getVideo = function (currentOption) {
            let src = currentOption.attr("data-src");
            let mimeType = currentOption.attr("data-mime-type");
            let sourceArr = [];
            let lookupKey = currentOption.parent().index() + "_" + currentOption.index();

            if (lookupKey in sourceCache) {
                return sourceCache[lookupKey];
            }

            if (typeof src === "undefined" || typeof mimeType === "undefined") {
                let sources = currentOption.attr("data-sources");
                if (typeof sources === "undefined") {
                    console.warn("No video sources found!");
                    return [];
                }

                let pairs = sources.split(";");
                for (let i in pairs) {
                    let pair = pairs[i];
                    if (pair.indexOf(",") === -1) {
                        continue;
                    }
                    let typeSrcArr = pair.split(",");
                    let type = typeSrcArr[0];
                    let src = typeSrcArr[1];

                    sourceArr.push({type: type.trim(), src: src.trim()});
                }
            } else {
                sourceArr.push({type: mimeType.trim(), src: src.trim()});
            }
            sourceCache[lookupKey] = sourceArr;
            return sourceArr;
        };

        videoChooserElement.change(function () {
            // reuse player
            var myPlayerVideo, myPlayerAudio;
            var selectElement = $(this);
            var currentOption = selectElement.find(":selected");

            if ($(".mir-player video").length > 0) {
                myPlayerVideo = selectElement.data("playerVideo");
                if (!myPlayerVideo) {
                    myPlayerVideo = videojs($(".mir-player video").attr("id"));
                    selectElement.data("playerVideo", myPlayerVideo);
                }
            }

            if ($(".mir-player audio").length > 0) {
                myPlayerAudio = selectElement.data("playerAudio");
                if(!myPlayerAudio){
                    myPlayerAudio = videojs($(".mir-player audio").attr("id"));
                    selectElement.data("playerAudio", myPlayerAudio);
                }
            }

            let playerToHide, playerToShow;
            let sourceArr = getVideo(currentOption);
            let isAudio = currentOption.attr("data-audio") == "true";
            let htmlEmbed = jQuery(".mir-player");

            if (isAudio) {
                playerToHide = myPlayerVideo;
                playerToShow = myPlayerAudio;
            } else {
                playerToShow = myPlayerVideo;
                playerToHide = myPlayerAudio;
            }


            hidePlayer(playerToHide);
            playerToShow.show();


            playerToShow.src(sourceArr);

        });

//--------

    $("body").on("click", ".mir_mainfile", function (event) {
      event.preventDefault();
      var that = $(this);
      var oldMainFile = $(".file_set.active_file");
      $(".file_set.active_file").removeClass("active_file");
      $(that).closest(".file_set").addClass("waiting_file");
      var path = $(this).data("path");
      path = (path.charAt(0) == "/" ? path.substr(1) : path);
      $.ajax({
        type: 'GET',
        url: webApplicationBaseURL + "servlets/MCRDerivateServlet?derivateid=" + $(this).data("derivateid") + "&objectid=" + $(this).data("objectid") + "&todo=ssetfile&file=" + path,
      }).done(function (result) {
        $(that).closest(".file_set").removeClass("waiting_file");
        $(that).closest(".file_set").addClass("active_file");
      }).fail(function (result) {
        $(that).closest(".file_set").removeClass("waiting_file");
        $(oldMainFile).addClass("active_file");
        console.log("Error while changing mainfile!");
      });
    });

    $('#copy_cite_link').click(function(event){
      event.preventDefault();
      $("#identifierModal").modal("show");
    });

    $("body").on("click", ".mir_copy_identifier", function () {
      var input = $(this).parents(".mir_identifier").find(".mir_identifier_hidden_input");
      $(input).removeClass("hidden");
      $(input).first().select();
      try {
        var successful = document.execCommand('copy');
        if (successful){
          $(this).attr('data-original-title', 'Copied!').tooltip('show');
        }
        else {
          $(this).attr('data-original-title', 'Oops, unable to copy').tooltip('show');
        }
      } catch (err) {
        $(this).attr('data-original-title', 'Oops, unable to copy').tooltip('show');
      }
      $(input).addClass("hidden");
    });

    $('.mir_copy_identifier').on('hidden.bs.tooltip', function () {
      $(this).attr('data-original-title', $(this).attr("data-org-title"));
    });

    $("body").on("focus", ".search-organization input[name*='mods:displayForm']", function() {
      $(".name-modal textarea").val($(this).val());
      $(this).addClass("inModal");
      $(".name-modal").modal("show");
    });

    $("body").on("keydown", ".name-modal textarea", function(event) {
      if (event.which == 27) {
        $(this).modal("hide");
      }
    });

    $("body").on("hide.bs.modal", ".name-modal", function() {
      var input = $(this).find("textarea").val().replace(/\n/g, " ");
      $(".inModal").val(input);
      $(".inModal").attr("title", input);
      $(".inModal").removeClass("inModal");
    });

    $("#mir_relatedItem > li > ul").hide();
    $("#mir_relatedItem_hideAll").hide();

    //show full version history in metadata view
    $("#historyStarter").click(function() {
      $("#historyModal").modal("show");
    });

    //define the primary button in a form with multiple submit buttons
    $("[order=primary-button]").ready(function() {
      var myForm = $("[order=primary-button]").parents("form:first");
      $(myForm).find("input[type=text]").keypress(function(event) {
        if(event.keyCode == 13 || event.which == 13) {
          $("[order=primary-button]").click();
        }
      });
    });

    function getSherpaIssn(elm) {
      $.ajax({
        url: webApplicationBaseURL + "servlets/MIRSherpaServlet?issn=" + $(elm).html(),
        type: "GET",
        success: function(data) {
          if(data != undefined && data != "") {
            $(elm).parent().after("<dt>SHERPA/RoMEO:</dt><dd><a href='http://www.sherpa.ac.uk/romeo/search.php?issn=" + $(elm).html() + "'>RoMEO " + data + " Journal</a>");
            $(elm).remove();
          }
          else {
            console.log("sherpa request failed for ISSN: " +  $(elm).html());
          }
        },
        error: function(error) {
          console.log(error);
        }
      });
    }

    //for select box in search field on hit list page
    $( ".search_type a" ).click(function() {
        $( "#search_type_label" ).html( $( this ).html() );
        $( "#search_type_button" ).attr( 'value', $( this ).attr('value') );
    });

    //change search string on result page
    $( ".search_box form" ).submit(function( event ) {
      var origSearchAction = $(this).attr('action');
      var addValue = encodeURIComponent(solrEscapeSearchValue($('.search_box input').val().trim()));
      if (origSearchAction.includes('servlets/solr/find')) {
        var replAction = origSearchAction.replace(/(.*[&|\?])(q=.*?)&(.*)/,'$1$3&');
        if ($('#search_type_button').attr('value') == 'all') {
            var newAction = replAction + "q=" + addValue;
          } else {
            var newAction = replAction + "q=" + addValue + "&df=" + $('#search_type_button').attr('value');
          }
      }
      else {
        var replAction = origSearchAction.replace(/(.*[&|\?])(q=.*?)&(.*)/,'$1$3&$2');
        if ($('#search_type_button').attr('value') == 'all') {
            var newAction = replAction + "+%2BallMeta:" + addValue;
          } else {
            var newAction = replAction + "+%2B" + $('#search_type_button').attr('value') + ":" + addValue;
          }
      }

      $(this).attr('action', newAction);
    });

    var languageList = jQuery('#topnav .languageList');
    jQuery('#topnav .languageSelect').click(function() {
      languageList.toggleClass('hide');
    });
    // editor fix (to many tables)
    $('table.editorPanel td:has(table)').css('padding', '0');

    $('.confirm_deletion').confirm();

    // activate empty nav-bar search
    $('.navbar-search').find(':input[value=""]').attr('disabled', false);

    // Search
    $("#index_search_form").submit(function () {
      if ($('#index_search').val().match('^((?!\\.\\*).)*' + '$')) {
        if ($('#index_search').val().match('[^\\.]\\*' + '$') || $('#index_search').val() === "*"){
          $('#index_search').val($('#index_search').val().replace('*','.*'));
        }
        else {
          $('#index_search').val($('#index_search').val()+".*");
        }
      }
    });

    $(".search_form").submit(function (evt) {
      if($(this).find("input[name='qry']").val().trim() == '') {
          evt.preventDefault();
      }
    });

    //date filter option
    $('.mir-search-options-date input').ready(function() {
      var currentURL = window.location.href;
      if(currentURL.indexOf('&fq=mods.dateIssued') > 0) {
        var fqDate = currentURL.substr(currentURL.indexOf('&fq=mods.dateIssued'));
        fqDate = decodeURIComponent(fqDate.split('&')[1]);

        //comparison val
        if(fqDate.indexOf('"') > 0) {
          $(".mir-search-options-date .list-group a").append(' = ');
        }
        if(fqDate.indexOf('+TO+*') > 0 && fqDate.indexOf('{') > 0) {
          $(".mir-search-options-date .list-group a").append(' > ');
        }
        if(fqDate.indexOf('+TO+*') > 0 && fqDate.indexOf('[') > 0) {
          $(".mir-search-options-date .list-group a").append(' >= ');
        }
        if(fqDate.indexOf('*+TO+') > 0 && fqDate.indexOf('}') > 0) {
          $(".mir-search-options-date .list-group a").append(' < ');
        }
        if(fqDate.indexOf('*+TO+') > 0 && fqDate.indexOf(']') > 0) {
          $(".mir-search-options-date .list-group a").append(' <= ');
        }

        //date val
        fqDate = fqDate.replace(/[a-zA-Z.:"+*={}/\]/\[]/g, '');
        $(".mir-search-options-date .list-group a").append(fqDate);
      }
    });

    //date filter option
    $('.mir-search-options-date #dateSearch').click(function() {
        var currentURL = window.location.href;
        var fqDate = '';
        var newURL = currentURL;
        var dateInput = $('.mir-search-options-date .dateContainer :input');
        var date = '';
        //piece together date
        if(!!$(dateInput[2]).val()) {
          date = $(dateInput[2]).val();
          if(!!$(dateInput[1]).val()) {
            date = date + '-' + $(dateInput[1]).val();
            if(!!$(dateInput[0]).val()) {
              date = date + '-' + $(dateInput[0]).val();
            }
          }
        }

        if(date != '') {
          if(currentURL.indexOf('&fq=mods.dateIssued') > 0) {
            fqDate = currentURL.substr(currentURL.indexOf('&fq=mods.dateIssued'));
            fqDate = fqDate.split('&')[1];
            newURL = currentURL.replace('&' + fqDate, '');
          }
          var operator = $('.mir-search-options-date select').val();
          if(operator == '=') {
            newURL = newURL + '&fq=mods.dateIssued%3A"' + date + '"';
          }
          if(operator == '>') {
            newURL = newURL + '&fq=mods.dateIssued%3A{' + date + '+TO+*]';
          }
          if(operator == '>=') {
            newURL = newURL + '&fq=mods.dateIssued%3A[' + date + '+TO+*]';
          }
          if(operator == '<') {
            newURL = newURL + '&fq=mods.dateIssued%3A[*+TO+' + date + '}';
          }
          if(operator == '<=') {
            newURL = newURL + '&fq=mods.dateIssued%3A[*+TO+' + date + ']';
          }
          window.location.href = newURL;
        }
    });

    $('.stopAutoclose').click(function(event) {
      event.stopPropagation()
    });

    //colapse the next element
    $('[data-toggle=collapse-next]').click(function() {
      $(this).next().collapse('toggle');
    });

    // for configuration look here: http://dotdotdot.frebsite.nl/
    if (jQuery.fn.dotdotdot) {

      $(".ellipsis-text").find("a.readmore").click(function() {

        var div = $(this).closest('.ellipsis-text');
        //$("a.readmore", div).hide();
        div.trigger('destroy');
        div.removeClass('ellipsis');
        $("a.readless", div).removeClass('hidden');

        $("a.readless", div).click(function(div) {
          var div = $(this).closest('.ellipsis-text');
          $("a.readmore", div).show();
          div.addClass('ellipsis');
          var readmore=$("a.readmore",div);
          readmore.clone(true,true).insertAfter( readmore );
          readmore.addClass('readmore-active');
          readmore.removeClass('hidden');
          div.dotdotdot({
            ellipsis	: '... ',
            after: "a.readmore-active",
            callback: dotdotdotCallback
          });
          $(this).addClass('hidden');
          return false;
        });

        return false;

      });

      $(".ellipsis").each(function( i ) {

        if (i > 0) $(this).addClass("active");

        var readmore=$("a.readmore",this);
        readmore.clone(true,true).insertAfter( readmore );
        readmore.addClass('readmore-active');
        readmore.removeClass('hidden');
        $(this).dotdotdot({
          ellipsis	: '... ',
          after: "a.readmore-active",
          callback: dotdotdotCallback
        });

        if (i > 0) $(this).removeClass("active");
      });
    };

    $("#mir_relatedItem > li > span").click(function(){
      if( $(this).parent().children("ul").is(":visible") ){
        $(this).parent().children("ul").hide();
        $(this).parent().children("span.glyphicon").removeClass('glyphicon-chevron-down');
        $(this).parent().children("span.glyphicon").addClass('glyphicon-chevron-right');
      } else {
        $(this).parent().children("ul").show();
        $(this).parent().children("span.glyphicon").removeClass('glyphicon-chevron-right');
        $(this).parent().children("span.glyphicon").addClass('glyphicon-chevron-down');
      }
    });

    $("#mir_relatedItem_showAll").click(function(event){
      event.preventDefault();
      $("#mir_relatedItem > li > ul").show();
      $("#mir_relatedItem > li > span.glyphicon").removeClass('glyphicon-chevron-right');
      $("#mir_relatedItem > li > span.glyphicon").addClass('glyphicon-chevron-down');
      $("#mir_relatedItem_showAll").hide();
      $("#mir_relatedItem_hideAll").show();
    });

    $("#mir_relatedItem_hideAll").click(function(event){
      event.preventDefault();
      $("#mir_relatedItem > li > ul").hide();
      $("#mir_relatedItem > li > span.glyphicon").removeClass('glyphicon-chevron-down');
      $("#mir_relatedItem > li > span.glyphicon").addClass('glyphicon-chevron-right');
      $("#mir_relatedItem_showAll").show();
      $("#mir_relatedItem_hideAll").hide();
    });


    $("#registerDOI").click(function (event) {
      var doiButton = jQuery(this);
      var mcrId = doiButton.attr("data-mycoreID");
      var baseURL = doiButton.attr("data-baseURL");
      var doiResource = baseURL + "rsc/pi/registration/service/Datacite/" + mcrId;

      $.ajax({
        type: 'POST',
        url: doiResource,
        data: {}
      }).done(function (result) {
        window.location.search="XSL.Status.Message=component.pi.register.doi.success&XSL.Status.Style=success";
      }).fail(function (result) {
        if("responseJSON" in result && "code" in result.responseJSON){
            window.location.search="XSL.Status.Message=component.pi.register.error." + result.responseJSON.code +"&XSL.Status.Style=danger";
        } else {
            window.location.search="XSL.Status.Message=component.pi.register.doi.error&XSL.Status.Style=danger";
        }
      });
    });

  }); // END $﻿(document).ready()

  function dotdotdotCallback(isTruncated, originalContent) {
    if (!isTruncated) {
      $("a.readmore", this).remove();
      $("a.readless", this).remove();
    }
  };
  
  window.solrEscapeSearchValue = function base_solrEscapeSearchValue(text){
	  return text.replace(/([\\!&|+\\-\\(\\)\\{\\}\\\[\\\]~:\\\\/^])/g, "\\$1"); // special chars: "!&|+-(){}[]~:\\/^"
  }


  window.fireMirSSQuery = function base_fireMirSSQuery(form) {
    $(form).find(':input[value=""]').attr('disabled', true);
    return true;
  };

  $(document).tooltip({
    selector : "[data-toggle=tooltip]",
    container : "body"
  });

})(jQuery);
