(function ($) {
	"use strict";

	/**
	* Extend the jQuery with the method adcStatementList
	* Should be call on the container of the statement list
	* 
	*     // Single closed question
	*     $('#adc_1').adcStatementList({
	*         iterations : [
	*           { id : 'U1', caption : "Iteration 1" },
	*           { id : 'U3', caption : "Iteration 2" },
	*           { id : 'U5', caption : "Iteration 3" }
	*         ]
	*     });
	*
	*     // Multi-coded question
	*     $('#adc_1').adcStatementList({
	*         isMultiple : true,
	*         iterations : [
	*           { id : 'L1', caption : "Iteration 1" },
	*           { id : 'L3', caption : "Iteration 2" },
	*           { id : 'L5', caption : "Iteration 3" }
	*         ]
	*     });
	*
	* @param {Object} options Statements list parameters
	* @param {Array}  options.iterations Array which contains the definition of iterations
	* @param {String} options.iterations[].id Id or name of the input which contains the value of the current iteration
	* @param {String} options.iterations[].caption Caption of the current iteration
	* @param {Boolean} [options.isMultiple] Indicates if the question is multiple
	* @return {jQuery} Returns the current instance of the root container for the call chains
	*/
	$.fn.adcStatementList = function adcStatementList(options) {
		// Verify if the options are correct
		// Require key:iterations (array)
		if (!options || !options.iterations || !options.iterations.length) {
			throw new Error('adcStatementList expect an option argument with an array of iterations');
		}
		
		(options.autoForward = Boolean(options.autoForward) || false);
		(options.scrollToTop = Boolean(options.scrollToTop) || false);
		(options.useRange = Boolean(options.useRange));
		(options.showCounter = Boolean(options.showCounter) || false);
				
		// Delegate .transition() calls to .animate() if the browser can't do CSS transitions.
		if (!$.support.transition) $.fn.transition = $.fn.animate;
				
		$(this).css({'max-width':options.maxWidth,'width':options.controlWidth});
		$(this).parents('.controlContainer').css({'width':'100%','overflow':'hidden'});
		
		if ( options.controlAlign === "center" ) {
			$(this).parents('.controlContainer').css({'text-align':'center'});
			$(this).css({'margin':'0px auto'});
		} else if ( options.controlAlign === "right" ) {
			$(this).css({'margin':'0 0 0 auto'});
		}
		
		// IE8 and below fix
		if (!Array.prototype.indexOf) {
			
		  Array.prototype.indexOf = function(elt /*, from*/) {
			var len = this.length >>> 0;
		
			var from = Number(arguments[1]) || 0;
			from = (from < 0)
				 ? Math.ceil(from)
				 : Math.floor(from);
			if (from < 0)
			  from += len;
		
			for (; from < len; from++) {
			  if (from in this && this[from] === elt)
				return from;
			}
			return -1;
		  };
		}
		
		// Global variables
		var $container = $(this),
			currentIteration = 0,
            iterations = options.iterations,
            isMultiple = Boolean(options.isMultiple),
			useAltColour = Boolean(options.useAltColour),
			useHLayout = Boolean(options.useHLayout),
			responseWidth = options.responseWidth,
			responseMargin = options.responseMargin,
			autoForward = options.autoForward,
			scrollToTop = options.scrollToTop,
			showCounter = options.showCounter,
            initialWidth = $container.find('.statement').width(),
			total_images = $container.find("img").length,
			images_loaded = 0;
		
		// Hide or show next buttons
		if ( options.topButtons === 'hide both' && !(isMultiple && options.bottomButtons === 'hide both') ) $container.find('.nextStatement:first, .previousStatement:first').remove();
		else if ( options.topButtons === 'show next' && !(isMultiple && options.bottomButtons === 'hide both') )  $container.find('.previousStatement:first').remove();
		else if ( options.topButtons === 'show back' )  $container.find('.nextStatement:first').remove();
		
		if ( options.bottomButtons === 'hide both' )	  $container.find('.nextStatement:last, .previousStatement:last').remove();
		else if ( options.bottomButtons === 'show next' ) $container.find('.previousStatement:last').remove();
		else if ( options.bottomButtons === 'show back' ) $container.find('.nextStatement:last').remove();
				
		// Convert RGB to hex
		function trim(arg) {
			return arg.replace(/^\s+|\s+$/g, "");
		}
		function isNumeric(arg) {
			return !isNaN(parseFloat(arg)) && isFinite(arg);
		}
		function isRgb(arg) {
			arg = trim(arg);
			return isNumeric(arg) && arg >= 0 && arg <= 255;
		}
		function rgbToHex(arg) {
			arg = parseInt(arg, 10).toString(16);
			return arg.length === 1 ? '0' + arg : arg; 
		}
		function processRgb(arg) {
			arg = arg.split(',');
	
			if ( (arg.length === 3 || arg.length === 4) && isRgb(arg[0]) && isRgb(arg[1]) && isRgb(arg[2]) ) {
				if (arg.length === 4 && !isNumeric(arg[3])) { return null; }
				return '#' + rgbToHex(arg[0]).toUpperCase() + rgbToHex(arg[1]).toUpperCase() + rgbToHex(arg[2]).toUpperCase();
			}
			else {
				return null;
			}
		}
		
		// For multi-coded question
		// Add the @valueToAdd in @currentValue (without duplicate)
		// and return the new value
		function addValue(currentValue, valueToAdd) {
			if (currentValue == '') {
				return valueToAdd;
			}

			var arr = String(currentValue).split(','), i, l, wasFound = false;

			for (i = 0, l = arr.length; i < l; i += 1) {
				if (arr[i] == valueToAdd) {
					wasFound = true;
					break;
				}
			}

			if (!wasFound) {
				currentValue += ',' + valueToAdd;
			}
			return currentValue;
		}

		// For multi-coded question
		// Remove the @valueToRemove from the @currentValue
		// and return the new value
		function removeValue(currentValue, valueToRemove) {
			if (currentValue === '') {
				return currentValue;
			}
			var arr = String(currentValue).split(','),
                        i, l,
                        newArray = [];
			for (i = 0, l = arr.length; i < l; i += 1) {
				if (arr[i] != valueToRemove) {
					newArray.push(arr[i]);
				}
			}
			currentValue = newArray.join(',');
			return currentValue;
		}
						
		// Select a statement for single
		// @this = target node
		function selectStatementSingle() {
					
			// hide error
			$('.error, #error-summary').hide();
			
			// disable clicking during animation
			if ( autoForward ) $container.off('click', '.responseItem');
			//$container.off('click', '.previousStatement');
			//$container.off('click', '.nextStatement');
	
			var $input = $('#' + iterations[currentIteration].id),
				$target = $(this),
				value = $target.data('value');

			$container.find('.selected').removeClass('selected');
			$target.addClass('selected');
			$input.val(value);
			
			//if ( $('#' + iterations[currentIteration].id).val() != '' ) $container.find('.nextStatement').show();
			//if ( $container.find('.nextStatement').size() === 0 || ( $container.find('.nextStatement').size() > 0 && autoForward) ) nextIteration(); //14/05/14
			if ( ($container.find('.nextStatement').css('display') === 'none' || $container.find('.nextStatement').size() === 0) || ( ($container.find('.nextStatement').css('display') != 'none' || $container.find('.nextStatement').size() > 0) && autoForward) ) nextIteration();
		}

		// Select a statement for multiple
		// @this = target node
		function selectStatementMulitple() {
						
			// hide error
			$('.error, #error-summary').hide();
			
			// disable clicking during animation
			var $target = $(this),
				value = $target.data('value'),
				$input = iterations[currentIteration].items[$target.data('id')].element,
				isExclusive = Boolean(iterations[currentIteration].items[$target.data('id')].isExclusive),
				currentValue = $input.val();

			if ($target.hasClass('selected')) {
				// Un-select

				$target.removeClass('selected');
				//$input.prop('checked', false);
				currentValue = removeValue(currentValue, value);
				
			} else {

				// Select

				if (!isExclusive) {
					
					// Check if any exclusive
					
					currentValue = addValue(currentValue, value);
					//$input.prop('checked', true);

					// Un-select all exclusives
					$container.find('.exclusive').each(function forEachExclusives() {
						$(this).removeClass('selected');
						//$input.prop('checked', false);
						currentValue = removeValue(currentValue, $(this).attr('data-value'));
					});
					//$('input[name^="' + iterations[currentIteration].id + ' "].exclusive').prop('checked', false);

				} else {

					// When exclusive un-select all others
					//$('input[name^="' + iterations[currentIteration].id + ' "]').prop('checked', false);
					$container.find('.selected').removeClass('selected');
					currentValue = value;
				}
				$target.addClass('selected');
			}

			// Update the value
			$input.val(currentValue);
			if ( currentValue != '' ) {
				$container.find('.nextStatement').css('visibility','visible').show();
				var width = initialWidth;
				if ( $container.find('.previousStatement.top').css('display') == "block" ) {
					width -= $container.find('.previousStatement.top').outerWidth(true);
				}
				if ( $container.find('.nextStatement.top').css('display') == "block" ) {
					width -= $container.find('.nextStatement.top').outerWidth(true);
				}
				$container.find('.statement').css('width',width);
			}
			else {
				$container.find('.nextStatement').hide();
				var width = initialWidth;
				if ( $container.find('.previousStatement.top').css('display') == "block" ) {
					width -= $container.find('.previousStatement.top').outerWidth(true);
				}
				if ( $container.find('.nextStatement.top').css('display') == "block" ) {
					width -= $container.find('.nextStatement.top').outerWidth(true);
				}
				$container.find('.statement').css('width',width);
			}
		}

		// Returns the width of the statement
		// according if the iteration is the first or the last
		function getStatementWidth() {
			var width = initialWidth;
			if (currentIteration > 0 && iterations.length > 0 && options.topButtons != 'hide both') {
				width -= $container.find('.previousStatement.top').outerWidth(true);
			}
			if (currentIteration < (iterations.length - 1) || options.topButtons != 'hide both') {
				width -= $container.find('.nextStatement.top').outerWidth(true);
			}
			return width;
		}

		// Update the navigation
		// Hide or display the button 
		// if the iteration is the first or last
		function updateNavigation() {
			if (currentIteration > 0 && iterations.length > 0) {
				if (options.topButtons != 'hide both' || options.bottomButtons != 'hide both') $container.find('.previousStatement').show(options.animationSpeed);
			} else {
				//$container.find('.previousStatement').hide(0);
				$container.find('.previousStatement').css('display','none');
			}
			if (currentIteration < (iterations.length - 1)) {
				//if (options.topButtons != 'hide both' || options.bottomButtons != 'hide both') $container.find('.nextStatement').show(options.animationSpeed);
				if (options.topButtons != 'hide both' || options.bottomButtons != 'hide both') $container.find('.nextStatement').show().css('visibility','hidden');
			} else {
				$container.find('.nextStatement').css('display','none');
			}
		}

		// Go to the previous loop iteration
		function previousIteration() {
			
			$container.off('click', '.responseItem');
			
			if (currentIteration <= 0) {
				return;
			}
			currentIteration--;

			var width = getStatementWidth(),
				css = {
					opacity: 0,
					left: '-=' + width,
					width: width
				};
			updateNavigation();
			$container.find('.statement').css('width',width).animate(css, options.animationSpeed, onAnimationComplete);
			
		}

		// Go to the next loop iteration
		function nextIteration() {
			
			$container.off('click', '.responseItem');
			
			currentIteration++;
			var width = getStatementWidth(),
				css = {
					opacity: 0,
					left: '-=' + width,
					width: width
				};
			if (currentIteration >= (iterations.length - 1)) {
				if ( options.autoForward === true ) {
					$container.find('.statement').animate(css, options.animationSpeed);
					$(':input[name=Next]:last').click();
					//hideResponses();
				} else {
					currentIteration--;	
					if ( $container.find('.nextStatement').css('display') != 'none' ) $container.find('.nextStatement').css('display','none');
					$(':input[name=Next]:last').click();
					//hideResponses();
					/*$("html").animate({ scrollTop: $('html').height() }, 'fast', function() {
						$(':input[name=Next]:last').click();
					});*/
				}
				return;
			} else {
				if ( scrollToTop ) {
					$("html, body").animate({ scrollTop: 0 }, "fast");
				}
			}
			updateNavigation();
			$container.find('.statement').css('width',width).animate(css, options.animationSpeed, onAnimationComplete);
			
		}

		// After the previous/next animation
		function onAnimationComplete() {
			if ( isMultiple ) displayIterationMultiple();
			else 			  displayIterationSingle();
			
			var width = getStatementWidth(),
					css = {
						opacity: 1,
						left: '+=' + width,
						width: width
					};

			$container.find('.statement').animate(css, options.animationSpeed);
		}
		
		// Display the right loop caption and the right responses
		function displayIterationSingle() {
			
			$container
			.on('click', '.responseItem', (!isMultiple) ? selectStatementSingle : selectStatementMulitple);
			
			if ( showCounter ) {
				if ( options.countDirection === 'count down' ) $container.find('.counterNumber').html(iterations.length - currentIteration - 1);
				else $container.find('.counterNumber').html(currentIteration + 1);	
			}
			
			// Display the info of the current loop iteration
			//$container.find('.statement_text').html(iterations[currentIteration].caption);
			$container.find('.statement_text').hide();
			$container.find('.statement_text[data-id="' + (currentIteration + 1) + '"]').show();
			
			$container.find('.statement').css('filter','');
			// add alt here
			if ( useAltColour ) {
				if ( (currentIteration % 2) == 0 ) $container.find('.statement').removeClass('altStatement').addClass('evenStatement');
				else $container.find('.statement').removeClass('evenStatement').addClass('altStatement');
			} else {
				$container.find('.statement').addClass('evenStatement');
			}

			var currentValues = $('#' + iterations[currentIteration].id).val();
			$container.find('.responseItem').each(function () {
				var value = $(this).data('value'),
					isSelected = (currentValues.indexOf(value) != -1);
				if (isSelected) {
					$(this).addClass('selected');
				} else {
					$(this).removeClass('selected');
				}
			});
			if ( $('#' + iterations[currentIteration].id).val() == '' ) $container.find('.nextStatement').hide();
			else if (options.topButtons != 'hide both' || options.bottomButtons != 'hide both') $container.find('.nextStatement').show().css('visibility','visible');
		}
		
		// Display the right loop caption and the right responses
		function displayIterationMultiple() {
			
			$container.on('click', '.responseItem', (!isMultiple) ? selectStatementSingle : selectStatementMulitple);
			
			if ( showCounter ) {
				if ( options.countDirection === 'count down' ) $container.find('.counterNumber').html(iterations.length - currentIteration - 1);
				else $('.counterNumber').html(currentIteration + 1);	
			}
			
			// Display the info of the current loop iteration
			//$container.find('.statement_text').html(iterations[currentIteration].items[0].caption);
			$container.find('.statement_text').hide();
			$container.find('.statement_text[data-id="' + (currentIteration + 1) + '"]').show();
			
			$container.find('.statement').css('filter','');
			// add alt here
			if ( useAltColour ) {
				if ( (currentIteration % 2) == 0 ) $container.find('.statement').removeClass('altStatement').addClass('evenStatement');
				else $container.find('.statement').removeClass('evenStatement').addClass('altStatement');
			} else {
				$container.find('.statement').addClass('evenStatement');
			}
			
			$container.find('.selected').removeClass('selected');
			
			var currentValues = iterations[currentIteration].items[0].element.val().split(","),
				currentValue;
			
			for ( var i=0; i<currentValues.length; i++ ) {
				//currentValue = items[i].element.val();
				currentValue = currentValues[i];
				$container.find('.responseItem').each(function () {
					var value = $(this).data('value'),
						isSelected = $(this).data('value') == currentValue ? true : false;
					if (isSelected) {
						$(this).addClass('selected');
					}
				});
				
			}
			
			if ( currentValue == '' ) $('.nextStatement').hide();
		}
		
		function hideResponses() {
			
			$container.find('.responseItem').each(function (index) {
				$container.removeClass('selected').off('click').animate({
					opacity: 0,
					left: '-=' + $container.outerWidth()
				}, options.animationSpeed );
			});
			
			if ( scrollToTop ) {
				$("html").animate({ scrollTop: $('html').height() }, 'fast', function() {
					$(':input[name=Next]:last').click();
				});
			} else {
				$(':input[name=Next]:last').click();
			}
				
		}

		// Check for missing images and resize
		$container.find('.responseItem img').each(function forEachImage() {
			//if ( $container.attr('src') == '' ) /*$container.remove();*/alert("foo");
			var size = {
				width: $(this).width(),
				height: $(this).height()
			};
			
			if (options.forceImageSize === "height" ) {
				if ( size.height > parseInt(options.maxImageHeight,10) ) {
					var ratio = ( parseInt(options.maxImageHeight,10) / size.height);
					size.height *= ratio,
					size.width  *= ratio;
				}
			} else if (options.forceImageSize === "width" ) {
				if ( size.width > parseInt(options.maxImageWidth,10) ) {
					var ratio = ( parseInt(options.maxImageWidth,10) / size.width);
					size.width  *= ratio,
					size.height *= ratio;
				}
				
			} else if (options.forceImageSize === "both" ) {
				if ( parseInt(options.maxImageHeight,10) > 0 && size.height > parseInt(options.maxImageHeight,10) ) {
					var ratio = ( parseInt(options.maxImageHeight,10) / size.height);
					size.height *= ratio,
					size.width  *= ratio;
				}
	
				if ( parseInt(options.maxImageWidth,10) > 0 && size.width > parseInt(options.maxImageWidth,10) ) {
					var ratio = ( parseInt(options.maxImageWidth,10) / size.width);
					size.width  *= ratio,
					size.height *= ratio;
				}




				
			} 
			$(this).css(size);
		});
		
		// add ns to last x items
		if ( options.numberNS > 0 ) $container.find('.responseItem').slice(-options.numberNS).addClass('ns');
		
		// Use range if on
		if ( options.useRange ) {
			var maxNumber = $container.find('.responseItem').size() - options.numberNS;
			var rangeArray = options.range.split(';');
			
			var rainbow1 = new Rainbow();
				rainbow1.setSpectrum(processRgb(rangeArray[0]), processRgb(rangeArray[2]));
				rainbow1.setNumberRange(0, maxNumber);
			var rainbow2 = new Rainbow();
				rainbow2.setSpectrum(processRgb(rangeArray[1]), processRgb(rangeArray[3]));
				rainbow2.setNumberRange(0, maxNumber);
			$container.find('.responseItem').slice(0,(options.numberNS > 0)?0-options.numberNS:$container.find('.responseItem').size()).each(function( index ) {

				if ( options.rangeGradientDirection == 'ltr' ) { 
					$(this).css({ 'background': '#'+rainbow1.colourAt(index) });
					$(this).css({ 'background': '-moz-linear-gradient(left,  #'+rainbow1.colourAt(index)+' 0%, #'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,#'+rainbow1.colourAt(index)+'), color-stop(100%,#'+rainbow2.colourAt(index)+'))' });
					$(this).css({ 'background': '-webkit-linear-gradient(left, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-o-linear-gradient(left, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-ms-linear-gradient(left, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': 'linear-gradient(to right, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=#'+rainbow1.colourAt(index)+', endColorstr=#'+rainbow2.colourAt(index)+',GradientType=1 )' });
				} else {
					$(this).css({ 'background': '#'+rainbow1.colourAt(index) });
					$(this).css({ 'background': '-moz-linear-gradient(top,  #'+rainbow1.colourAt(index)+' 0%, #'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-webkit-gradient(linear, left top, left bottom, color-stop(0%,#'+rainbow1.colourAt(index)+'), color-stop(100%,#'+rainbow2.colourAt(index)+'))' });
					$(this).css({ 'background': '-webkit-linear-gradient(top, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-o-linear-gradient(top, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-ms-linear-gradient(top, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': 'linear-gradient(to bottom, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=#'+rainbow1.colourAt(index)+', endColorstr=#'+rainbow2.colourAt(index)+',GradientType=0 )' });
				}
				
			});
		}
		
		// Horizontal layout
		if ( useHLayout ) {
			$container.find('.responseItem').width(options.responseWidth).css({'float':'left','clear':'none','margin':responseMargin});
			var maxResponseHeight = Math.max.apply( null, $container.find('.responseItem').map( function () {
				return $( this ).outerHeight();
			}).get() );
			$container.find('.responseItem').height(maxResponseHeight);
		}
		
		// Attach all events
		/*$container
			.delegate('.responseItem', 'click', (!isMultiple) ? selectStatementSingle : selectStatementMulitple)
			.delegate('.previousStatement', 'click', previousIteration)
			.delegate('.nextStatement', 'click', nextIteration);*/
			
		$container
			.on('click', '.previousStatement', previousIteration)
			.on('click', '.nextStatement', nextIteration);
			/*.on('click', '.responseItem', (!isMultiple) ? selectStatementSingle : selectStatementMulitple)*/
		

		// Refresh the current status on load 
		// (iteration = 0)
		//$container.find('.previousStatement').hide();
		//$container.find('.statement').width(getStatementWidth());
		
		if ( isMultiple ) displayIterationMultiple();
		else 			  displayIterationSingle();
		
		if ( isMultiple || ( !isMultiple && (options.topButtons != 'hide both' || options.bottomButtons != 'hide both') ) ) {	
			if ( currentIteration === 0 ) $container.find('.previousStatement').css('display','none');
			$container.find('.nextStatement').css({'display':'block','margin-left':'10px','float':'right'});
			$container.find('.statement').width($container.find('.statement').width() - $container.find('.nextStatement.top').outerWidth(true)).css('float','left');
			$container.find('.nextStatement').height($container.find('.statement').height());
			
			$container.find('.previousStatement').css({'display':'block','margin-right':'10px','float':'left'});
			$container.find('.previousStatement').height($container.find('.statement').height()).hide();
			if ( $('#' + iterations[currentIteration].id).val() == '' && !isMultiple) $container.find('.nextStatement').hide();
			else if ( isMultiple ) {
				if ( iterations[currentIteration].items[0].element.val() == '' ) $container.find('.nextStatement').hide();
			}
		}
		
		for ( var i=0; i<iterations.length; i++ ) {
			if ( (!isMultiple && $('#' + iterations[i].id).val() == '') || (isMultiple && iterations[currentIteration].items[0].element.val() == '')) {
				if ( i!=0 ) {
					currentIteration--;
					nextIteration();
				}
				break;
			} else {
				if ( i == iterations.length - 1 ) {
					currentIteration--;
					nextIteration();
				} else {
					currentIteration++;
				}
			}
		}
		
		if ( total_images > 0 ) {
			$container.find('img').each(function() {
				var fakeSrc = $(this).attr('src');
				$("<img/>").css('display', 'none').load(function() {
					images_loaded++;
					if (images_loaded >= total_images) {
						
						// now all images are loaded.
						$container.css('visibility','visible');
						
						if ( options.animate ) {
							var delay = 0,
								easing = (!$.support.transition)?'swing':'snap';
							
							$container.find('.responseItem').each(function forEachItem() {
								$container.css({ y: 200, opacity: 0 }).transition({ y: 0, opacity: 1, delay: delay }, options.animationSpeed, easing);
								delay += 30;
							});
						}
	
					}
				}).attr("src", fakeSrc);
			});
		} else {
			$container.css('visibility','visible');
						
			if ( options.animate ) {
				var delay = 0,
					easing = (!$.support.transition)?'swing':'snap';
				
				$container.find('.responseItem').each(function forEachItem() {
					$container.css({ y: 200, opacity: 0 }).transition({ y: 0, opacity: 1, delay: delay }, options.animationSpeed, easing);
					delay += 30;
				});
			}
		}

		// Returns the container
		return this;
	};

} (jQuery));