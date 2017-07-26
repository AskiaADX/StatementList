/* standard_single.js */
{% 
Dim i 
Dim ar = CurrentQuestion.ParentLoop.Answers
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
	{caption : '{%= caption %}', element : $('#{%= inputId%}'), resource: '{%= resource %}'}{%= On(i < ar.Count, ",", "") %}
{% Next %}