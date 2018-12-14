/* standard_single.js */
{% 
Dim inputName
Dim inputId

Dim i 
Dim ar = CurrentQuestion.ParentLoop.AvailableAnswers

For i = 1 To ar.Count 
	inputName = CurrentQuestion.Iteration(ar[i].Index).InputName()
	inputId   = inputName
%}
{id : document.getElementById('{%= inputName%}')}{%= On(i < ar.Count, ",", "") %}
{% Next %}