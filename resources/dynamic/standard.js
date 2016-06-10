/* standard.js */
$(window).load(function() {
	$('#adc_{%= CurrentADC.InstanceId %}').adcStatementList({
		maxWidth : '{%= CurrentADC.PropValue("maxWidth") %}',
		controlWidth : '{%= CurrentADC.PropValue("controlWidth") %}',
		maxImageWidth : '{%= CurrentADC.PropValue("maxImageWidth") %}',
		maxImageHeight : '{%= CurrentADC.PropValue("maxImageHeight") %}',
		forceImageSize : '{%= CurrentADC.PropValue("forceImageSize") %}',
		autoForward : {%= (CurrentADC.PropValue("autoForward") = "1") %},
		scrollToTop : {%= (CurrentADC.PropValue("scrollToTop") = "1") %},
		animate : {%= (CurrentADC.PropValue("animateResponses") = "1") %},
		animationSpeed : '{%= CurrentADC.PropValue("animationSpeed") %}',
		topButtons : '{%= CurrentADC.PropValue("topButtons") %}',
		bottomButtons : '{%= CurrentADC.PropValue("bottomButtons") %}',
		showCounter : {%= (CurrentADC.PropValue("showCounter") = "1") %},
		countDirection : '{%= CurrentADC.PropValue("countDirection") %}',
		numberNS: {%= CurrentADC.PropValue("numberNS") %},
		useRange: {%= (CurrentADC.PropValue("useRange") = "1") %},
		showResponseHoverColour: {%= (CurrentADC.PropValue("showResponseHoverColour") = "1") %},
		showResponseHoverFontColour: {%= (CurrentADC.PropValue("showResponseHoverFontColour") = "1") %},
		showResponseHoverBorder: {%= (CurrentADC.PropValue("showResponseHoverBorder") = "1") %},
		controlAlign : '{%= CurrentADC.PropValue("controlAlign") %}',
		rangeGradientDirection : '{%= CurrentADC.PropValue("rangeGradientDirection") %}',
		useAltColour: {%= (CurrentADC.PropValue("useAltColour") = "1") %},
		useHLayout: {%= (CurrentADC.PropValue("useHLayout") = "1") %},
		responseWidth: '{%= CurrentADC.PropValue("responseWidth") %}',
		responseMargin: '{%= CurrentADC.PropValue("responseMargin") %}',
        hideNextBtn: '{%= CurrentADC.PropValue("hideNextBtn") %}',
		disableReturn: {%= (CurrentADC.PropValue("disableReturn") = "1") %},
		{% IF CurrentADC.PropValue("useRange") = "1" Then %}
			range: '{%= CurrentADC.PropValue("responseColourPrimary") %};{%= CurrentADC.PropValue("responseColourSecondary") %};{%= CurrentADC.PropValue("responseColourRangePrimary") %};{%= CurrentADC.PropValue("responseColourRangeSecondary") %}',
		{% EndIF %}
		{% IF CurrentQuestion.Type = "multiple" Then %}
			isMultiple : true,
		{% EndIF %}
		iterations: [
			{% IF CurrentQuestion.Type = "single" Then %}
				{%:= CurrentADC.GetContent("dynamic/standard_single.js").ToText()%}
			{% ElseIf CurrentQuestion.Type = "multiple" Then %}
				{%:= CurrentADC.GetContent("dynamic/standard_multiple.js").ToText()%}
			{% EndIF %}
		]
	});
});