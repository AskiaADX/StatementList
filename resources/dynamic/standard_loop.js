/* standard_single.js */
{% 
Dim i 
Dim ar = CurrentQuestion.ParentLoop.AvailableAnswers
Dim inputName
Dim inputId
Dim caption
Dim resource

For i = 1 To ar.Count 
	inputName = ar[i].InputName()
	inputId   = inputName + "_" + i
	caption   = ar[i].Caption
	resource  = ar.ResourceURL[i]
%}
	{caption : '{%= caption %}', element : document.getElementById('{%= inputName%}'), resource: '{%= resource %}'}{%= On(i < ar.Count, ",", "") %}
{% Next %}