(function () {

  // Polyfill: Add a getElementsByClassName function IE < 9
  function polyfillGetElementsByClassName () {
    if (!document.getElementsByClassName) {
      document.getElementsByClassName = function (search) {
        var d = document,
          elements, pattern, i, results = [];
        if (d.querySelectorAll) { // IE8
          return d.querySelectorAll('.' + search);
        }
        if (d.evaluate) { // IE6, IE7
          pattern = './/*[contains(concat(\' \', @class, \' \'), \' ' + search + ' \')]';
          elements = d.evaluate(pattern, d, null, 0, null);
          while ((i = elements.iterateNext())) {
            results.push(i);
          }
        } else {
          elements = d.getElementsByTagName('*');
          pattern = new RegExp('(^|\\s)' + search + '(\\s|$)');
          for (var j = 0, l = elements.length; j < l; j++) {
            if (pattern.test(elements[j].className)) {
              results.push(elements[j]);
            }
          }
        }
        return results;
      };
    }
  }

  function hasClass (el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp('\\b' + className + '\\b').test(el.className);
  }

  function addClass (el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += ' ' + className;
  }

  function removeClass (el, className) {
    if (el.classList) el.classList.remove(className);
    else el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
  }

  // IE8 and below fix
  if (!Array.prototype.indexOf) {

    Array.prototype.indexOf = function (elt /*, from*/ ) {
      var len = this.length >>> 0;

      var from = Number(arguments[1]) || 0;
      from = (from < 0)
        ? Math.ceil(from)
        : Math.floor(from);
      if (from < 0)        {
        from += len;
      }

      for (; from < len; from++) {
        if (from in this && this[from] === elt)          {
          return from;
        }
      }
      return -1;
    };
  }

  function StatementsList (options) {
    this.instanceId = options.instanceId || 1;
    var container = document.getElementById('adc_' + this.instanceId),
      images = [].slice.call(container.getElementsByTagName('img')),
      total_images = container.getElementsByTagName('img').length;

    function loadImages (images, callback) {
      var count = 0;

      function check (n) {
        if (n == total_images) {
          callback();
        }
      }

      for (i = 0; i < total_images; ++i) {
        var src = images[i].src;
        var img = document.createElement('img');
        img.src = src;

        img.addEventListener('load', function () {
          if (this.complete) {
            count++;
            check(count);
          }
        });
      }
    }

    window.addEventListener('load', function () {
      if (total_images > 0) {
        loadImages(images, function () {
          init(options);
        });
      } else {
        init(options);
      }
    });

  }

  function init (options) {

    this.options = options;
    this.instanceId = options.instanceId || 1;
    (options.autoForward = Boolean(options.autoForward) || false);
    (options.scrollToTop = Boolean(options.scrollToTop) || false);
    (options.useRange = Boolean(options.useRange));
    (options.showCounter = Boolean(options.showCounter) || false);
    (options.chineseCounter = Boolean(options.chineseCounter) || false);
    (options.currentQuestion = options.currentQuestion || '');

    polyfillGetElementsByClassName();

    var container = document.getElementById('adc_' + this.instanceId),
      responseItems = [].slice.call(container.getElementsByClassName('responseItem')),
      images = [].slice.call(container.getElementsByTagName('img')),
      inputs = [].slice.call(document.getElementsByTagName('input')),
      nextBtn,
      isMultiple = Boolean(options.isMultiple),
      currentIteration = 0,
      iterations = options.iterations,
      useAltColour = Boolean(options.useAltColour),
      useHLayout = Boolean(options.useHLayout),
      responseWidth = options.responseWidth,
      responseMargin = options.responseMargin,
      autoForward = options.autoForward,
      scrollToTop = options.scrollToTop,
      showCounter = options.showCounter,
      chineseCounter = options.chineseCounter,
      initialWidth = container.clientWidth,
      hideNextBtn = options.hideNextBtn,
      disableReturn = Boolean(options.disableReturn);


    if (!options || !options.iterations || !options.iterations.length) {
      throw new Error('adcStatementList expect an option argument with an array of iterations');
    }

    nextBtn = document.querySelector('input[name="Next"]');

    container.style.maxWidth = options.maxWidth;
    container.style.width = options.controlWidth;
    container.parentNode.style.width = '100%';
    container.parentNode.style.overflow = 'hidden';

    if (options.controlAlign === 'center') {
      container.parentNode.style.textAlign = 'center';
      container.style.margin = '0px auto';
    } else if (options.controlAlign === 'right') {
      container.style.margin = '0 0 0 auto';
    }

    // Check for missing images and resize
    for (i = 0; i < images.length; i++) {
      var size = {
        width: images[i].width,
        height: images[i].height
      };
      var ratio;

      if (options.forceImageSize === 'height') {
        if (size.height > parseInt(options.maxImageHeight, 10)) {
          ratio = (parseInt(options.maxImageHeight, 10) / size.height);
          size.height *= ratio;
          size.width *= ratio;
        }
      } else if (options.forceImageSize === 'width') {
        if (size.width > parseInt(options.maxImageWidth, 10)) {
          ratio = (parseInt(options.maxImageWidth, 10) / size.width);
          size.width *= ratio;
          size.height *= ratio;
        }
      } else if (options.forceImageSize === 'both') {
        if (parseInt(options.maxImageHeight, 10) > 0 && size.height > parseInt(options.maxImageHeight, 10)) {
          ratio = (parseInt(options.maxImageHeight, 10) / size.height);
          size.height *= ratio;
          size.width *= ratio;
        }

        if (parseInt(options.maxImageWidth, 10) > 0 && size.width > parseInt(options.maxImageWidth, 10)) {
          ratio = (parseInt(options.maxImageWidth, 10) / size.width);
          size.width *= ratio;
          size.height *= ratio;
        }

      }
      images[i].width = size.width;
      images[i].height = size.height;
    }

    // If image align is center
    if (options.imageAlign === 'center') {
      for (i = 0; i < images.length; i++) {
        images[i].style.marginLeft = 'auto';
        images[i].style.marginRight = 'auto';
      }
      for (i = 0; i < responseItems.length; i++) {
        responseItems[i].style.textAlign = 'center';
      }
    }

    // add ns to last x items
    var nsItems;
    if (options.numberNS > 0) {
      nsItems = responseItems.slice(-options.numberNS);
      for (i = 0; i < nsItems.length; i++) {
        addClass(nsItems[i], 'ns');
        nsItems[i].style.filter = '';
      }
    }

    // Use range if on
    if (options.useRange) {
      var maxNumber = responseItems.length - options.numberNS,
        rangeArray = options.range.split(';');
      var rainbow1 = new Rainbow();
      rainbow1.setSpectrum(processRgb(rangeArray[0]), processRgb(rangeArray[2]));
      rainbow1.setNumberRange(0, maxNumber);
      var rainbow2 = new Rainbow();
      rainbow2.setSpectrum(processRgb(rangeArray[1]), processRgb(rangeArray[3]));
      rainbow2.setNumberRange(0, maxNumber);

      nsItems = responseItems.slice(0, (options.numberNS > 0) ? 0 - options.numberNS : responseItems.length);
      for (i = 0; i < nsItems.length; i++) {
        if (options.rangeGradientDirection === 'ltr') {
          nsItems[i].style.backgroundColor = '#' + rainbow1.colourAt(i);
          addClass(nsItems[i], 'active');
          removeClass(nsItems[i], 'active');
        } else {
          nsItems[i].style.backgroundColor = '#' + rainbow2.colourAt(i);
          addClass(nsItems[i], 'active');
          removeClass(nsItems[i], 'active');
        }
      }
    }

    // Hide or show next buttons
    var el,
      nextStatements = [].slice.call(container.getElementsByClassName('nextStatement')),
      prevStatements = [].slice.call(container.getElementsByClassName('previousStatement')),
      statementTexts = [].slice.call(container.getElementsByClassName('statement_text'));
      statementImages = [].slice.call(container.getElementsByClassName('statement_image'));

    if (options.topButtons === 'hide both' && !(isMultiple && options.bottomButtons === 'hide both')) {
      el = nextStatements[0];
      el.parentNode.removeChild(el);
      el = prevStatements[0];
      el.parentNode.removeChild(el);
    } else if (options.topButtons === 'show next' && !(isMultiple && options.bottomButtons === 'hide both')) {
      el = prevStatements[0];
      el.parentNode.removeChild(el);
    } else if (options.topButtons === 'show back') {
      el = nextStatements[0];
      el.parentNode.removeChild(el);
    }
    nextStatements = [].slice.call(container.getElementsByClassName('nextStatement'));
    prevStatements = [].slice.call(container.getElementsByClassName('previousStatement'));

    if (options.bottomButtons === 'hide both') {
      el = nextStatements[nextStatements.length - 1];
      el.parentNode.removeChild(el);
      el = prevStatements[prevStatements.length - 1];
      el.parentNode.removeChild(el);
    } else if (options.bottomButtons === 'show next') {
      el = prevStatements[prevStatements.length - 1];
      el.parentNode.removeChild(el);
    } else if (options.bottomButtons === 'show back') {
      el = nextStatements[nextStatements.length - 1];
      el.parentNode.removeChild(el);
    }
    nextStatements = [].slice.call(container.getElementsByClassName('nextStatement'));
    prevStatements = [].slice.call(container.getElementsByClassName('previousStatement'));

    var m_IsPageUnLocked = false;

    function disableNext () {

      if (disableReturn) {

        function addEvent (elem, event, fn) {

          if (typeof elem === 'string') {
            elem = document.getElementById(elem);
          }

          function listenHandler (e) {
            var ret = fn.apply(this, arguments);
            if (ret === false) {
              e.stopPropagation();
              e.preventDefault();
            }
            return (ret);
          }

          function attachHandler () {
            window.event.target = window.event.srcElement;

            var ret = fn.call(elem, window.event);

            if (ret === false) {
              window.event.returnValue = false;
              window.event.cancelBubble = true;
            }
            return (ret);
          }

          if (elem.addEventListener) {
            elem.addEventListener(event, listenHandler, false);
          } else {
            elem.attachEvent('on' + event, attachHandler);
          }
        }

        function enterKey (e) {
          if (!e) {
            e = window.event; // Get event details for IE
            e.which = e.keyCode; // assign which property (so rest of the code works using e.which)
          }
          var elt = (e.target) ? e.target : e.srcElement;
          var key = e.which || e.keyCode;
          if (key == 13 && elt.tagName !== 'TEXTAREA' && elt.type !== 'submit') {
            return false;
          }
        }
        if (typeof NavigatorHandler !== 'undefined') {
        	NavigatorHandler.keydown = function (e) {
              var event = e;
              enterKey(event);
              return true;
            };
        }

        var elem = document.documentElement || document.body;
        addEvent(elem, 'keydown', enterKey);

        m_IsPageUnLocked = false;

        function verifySubmit (e) {
          if (!e) e = window.event;
          e.returnValue = m_IsPageUnLocked;
          return m_IsPageUnLocked;
        }

        document.documentElement.onSubmit = verifySubmit;
      }
      document.querySelector('input[name="Next"]').style.display = 'none';

    }

    ///Display the navigation buttons
    function enableNext () {
      //Unlock the page
      m_IsPageUnLocked = true;
      //Display the button next
      document.querySelector('input[name="Next"]').style.display = '';
      document.documentElement.onSubmit = '';
    }

    if (hideNextBtn === 'Until All items displayed' || hideNextBtn === 'Until All items answered' || hideNextBtn === 'Always') {
      // hide next and disable pressing enter to submit form.
      disableNext();
    }

    // Convert RGB to hex
    function trim (arg) {
      return arg.replace(/^\s+|\s+$/g, '');
    }

    function isNumeric (arg) {
      return !isNaN(parseFloat(arg)) && isFinite(arg);
    }

    function isRgb (arg) {
      arg = trim(arg);
      return isNumeric(arg) && arg >= 0 && arg <= 255;
    }

    function rgbToHex (arg) {
      arg = parseInt(arg, 10).toString(16);
      return arg.length === 1 ? '0' + arg : arg;
    }

    function processRgb (arg) {
      arg = arg.split(',');

      if ((arg.length === 3 || arg.length === 4) && isRgb(arg[0]) && isRgb(arg[1]) && isRgb(arg[2])) {
        if (arg.length === 4 && !isNumeric(arg[3])) {
          return null;
        }
        return '#' + rgbToHex(arg[0]).toUpperCase() + rgbToHex(arg[1]).toUpperCase() + rgbToHex(arg[2]).toUpperCase();
      } else {
        return null;
      }
    }

    // For multi-coded question
    // Add the @valueToAdd in @currentValue (without duplicate)
    // and return the new value
    function addValue (currentValue, valueToAdd) {

      if (currentValue === '' || currentValue === null) {
        return valueToAdd;
      }
      var arr = String(currentValue).split(','),
        i, l, wasFound = false;
      for (i = 0, l = arr.length; i < l; i += 1) {
        if (arr[i] === valueToAdd) {
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
    function removeValue (currentValue, valueToRemove) {
      if (currentValue === '' || currentValue === null) {
        return currentValue;
      }
      var arr = String(currentValue).split(','),
        i, l, newArray = [];
      for (i = 0, l = arr.length; i < l; i += 1) {
        if (arr[i] !== valueToRemove) {
          newArray.push(arr[i]);
        }
      }
      currentValue = newArray.join(',');
      return currentValue;
    }

    function addEvent (el, type, handler) {
      if (el.attachEvent) el.attachEvent('on' + type, handler);
      else el.addEventListener(type, handler);
    }

    function removeEvent (el, type, handler) {
      if (el.detachEvent) el.detachEvent('on' + type, handler);
      else el.removeEventListener(type, handler);
    }

    // Select a statement for single
    // @this = target node
    function selectStatementSingle (target) {

      // hide error
      if (container.querySelector('.error')) {
        container.querySelector('.error').style.display = 'none';
        container.querySelector('#error-summary').style.display = 'none';
      }

      // disable clicking during animation
      if (autoForward) {
        for (i = 0; i < responseItems.length; i++) {
          removeEvent(responseItems[i], 'click');
        }
      }

      var input = iterations[currentIteration].id,
        value = target.getAttribute('data-value'),
        selectedElements = [].slice.call(container.getElementsByClassName('selected'));

      for (i = 0; i < selectedElements.length; i++) {
        removeClass(selectedElements[i], 'selected');
      }

      addClass(target, 'selected');
      input.value = value;

      if (window.askia &&
        window.arrLiveRoutingShortcut &&
        window.arrLiveRoutingShortcut.length > 0 &&
        window.arrLiveRoutingShortcut.indexOf(options.currentQuestion) >= 0) {
        askia.triggerAnswer();
      }

      if (checkAllAnswered() === iterations.length && hideNextBtn === 'Until All items answered') {
        enableNext();
      } else if (checkAllAnswered() !== iterations.length && hideNextBtn === 'Until All items answered') {
        disableNext();
      }

      if (!autoForward) {
        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = '';
        }
      }

      if (nextStatements.length > 0) {
        if (autoForward) {
          setTimeout(function() {nextIteration();}, 100);
        }
      } else {
          setTimeout(function() {nextIteration();}, 100);
      }

    }

    // Select a statement for multiple
    // @this = target node
    function selectStatementMulitple (target) {

      // hide error
      if (container.querySelector('.error')) {
        container.querySelector('.error').style.display = 'none';
        container.querySelector('#error-summary').style.display = 'none';
      }

      var value = target.getAttribute('data-value'),
        input = iterations[currentIteration].items[target.getAttribute('data-id')].element,
        isExclusive = Boolean(iterations[currentIteration].items[target.getAttribute('data-id')].isExclusive),
        currentValue = input.value;

      if (hasClass(target, 'selected')) {
        // Un-select
        removeClass(target, 'selected');
        currentValue = removeValue(currentValue, value);

      } else {

        // Select
        if (!isExclusive) {

          // Check if any exclusive
          currentValue = addValue(currentValue, value);

          // Un-select all exclusives
          var exclusiveElements = [].slice.call(container.getElementsByClassName('exclusive'));

          for (i = 0; i < exclusiveElements.length; i++) {
            removeClass(exclusiveElements[i], 'selected');
            currentValue = removeValue(currentValue, exclusiveElements[i].getAttribute('data-value'));
          }

        } else {

          // When exclusive un-select all others
          var selectedElements = [].slice.call(container.getElementsByClassName('selected'));
          for (i = 0; i < selectedElements.length; i++) {
            removeClass(selectedElements[i], 'selected');
          }
          currentValue = value;
        }
        addClass(target, 'selected');
      }

      // Update the value
      input.value = currentValue;

      if (window.askia &&
        window.arrLiveRoutingShortcut &&
        window.arrLiveRoutingShortcut.length > 0 &&
        window.arrLiveRoutingShortcut.indexOf(options.currentQuestion) >= 0) {
        askia.triggerAnswer();
      }

      if (currentValue != '') {

        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.visibility = 'visible';
          nextStatements[i].style.display = '';
        }

      } else {

        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = 'none';
        }

      }

      var width = container.offsetWidth;
      if (container.querySelector('.previousStatement.top').style.display == '') {
        width -= outerWidth(container.querySelector('.previousStatement.top')) + lrBorder(container.querySelector('.previousStatement.top'));
      }
      if (container.querySelector('.nextStatement.top').style.display == '') {
        width -= outerWidth(container.querySelector('.nextStatement.top')) + lrBorder(container.querySelector('.nextStatement.top'));
      }
      container.querySelector('.statement').style.width = width + 'px';
      if (checkAllAnswered() === iterations.length && hideNextBtn === 'Until All items answered') {
        enableNext();
      } else if (checkAllAnswered() !== iterations.length && hideNextBtn === 'Until All items answered') {
        disableNext();
      }
    }

    // Returns the width of the statement
    // according if the iteration is the first or the last
    function getStatementWidth () {

      var width = container.clientWidth,
        previousStatementTopOWidth = container.querySelector('.previousStatement.top') ? outerWidth(container.querySelector('.previousStatement.top')) : 0,
        previousStatementTopLRBorder = container.querySelector('.previousStatement.top') ? lrBorder(container.querySelector('.previousStatement.top')) : 0,
        nextStatementTopOWidth = container.querySelector('.nextStatement.top') ? outerWidth(container.querySelector('.nextStatement.top')) : 0,
        nextStatementTopLRBorder = container.querySelector('.nextStatement.top') ? lrBorder(container.querySelector('.nextStatement.top')) : 0,
        btnWidth = previousStatementTopOWidth > nextStatementTopOWidth
        ? (previousStatementTopOWidth + previousStatementTopLRBorder)
        : (nextStatementTopOWidth + nextStatementTopLRBorder);

      if (currentIteration > 0 && iterations.length > 0 && options.topButtons != 'hide both') {
        width -= btnWidth;
      }
      if (currentIteration < (iterations.length - 1) || options.topButtons != 'hide both') {
        width -= btnWidth;
      }
      return width - 2;
    }

    // Update the navigation
    // Hide or display the button
    // if the iteration is the first or last
    function updateNavigation () {
      if (currentIteration > 0 && iterations.length > 0) {
        if (options.topButtons !== 'hide both' || options.bottomButtons !== 'hide both') {
          for (i = 0; i < prevStatements.length; i++) {
            prevStatements[i].style.display = '';
          }
        }
      } else {
        for (i = 0; i < prevStatements.length; i++) {
          prevStatements[i].style.display = 'none';
        }
      }
      if (currentIteration < (iterations.length - 1)) {
        if (options.topButtons !== 'hide both' || options.bottomButtons !== 'hide both') {
          for (i = 0; i < nextStatements.length; i++) {
            nextStatements[i].style.visibility = 'visible';
            nextStatements[i].style.display = '';
          }
        }
      } else {
        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = 'none';
        }
      }
    }

    // Go to the previous loop iteration
    function previousIteration () {

      for (i = 0; i < responseItems.length; i++) {
        removeEvent(responseItems[i], 'click');
      }

      if (currentIteration <= 0) {
        return;
      }
      currentIteration--;

      var width = (getStatementWidth() - 3),
        css = {
          opacity: 0,
          left: '-=' + width,
          width: width
        };
      updateNavigation();
      container.querySelector('.statement').style.width = width  + 'px';
      //$container.find('.statement').css('width',width).animate(css, options.animationSpeed, onAnimationComplete);
      var leftPos = container.querySelector('.statement').style.left;
      container.querySelector('.statement').style.left = -outerWidth(container) + 'px';

      setTimeout(function () {
        container.querySelector('.statement').style.left = leftPos + 'px';
        container.querySelector('.statement').style.width = css.width + 'px';
        container.querySelector('.statement').style.opacity = 0;
        container.querySelector('.statement').style.width = css.width + 'px';
        onAnimationComplete();
      }, 200);

    }

      // Helper function to get an element's exact position
      function getPosition(el) {
          var xPos = 0;
          var yPos = 0;

          while (el) {
              // for all other non-BODY elements
              // xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
              // yPos += (el.offsetTop - el.scrollTop + el.clientTop);
              xPos += (el.offsetLeft + el.clientLeft);
              yPos += (el.offsetTop + el.clientTop);
              el = el.offsetParent;
          }
          return {
              x: xPos,
              y: yPos
          };
      }

      function scrollIt(destination, duration, easing, callback) {

          var easings = {
              linear: function linear(t)  {
                  return t;
              },
              easeInQuad: function easeInQuad(t) {
                  return t * t;
              },
              easeOutQuad: function easeOutQuad(t) {
                  return t * (2 - t);
              },
              easeInOutQuad: function easeInOutQuad(t) {
                  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
              },
              easeInCubic: function easeInCubic(t) {
                  return t * t * t;
              },
              easeOutCubic: function easeOutCubic(t) {
                  return (--t) * t * t + 1;
              },
              easeInOutCubic: function easeInOutCubic(t) {
                  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
              },
              easeInQuart: function easeInQuart(t) {
                  return t * t * t * t;
              },
              easeOutQuart: function easeOutQuart(t) {
                  return 1 - (--t) * t * t * t;
              },
              easeInOutQuart: function easeInOutQuart(t) {
                  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
              },
              easeInQuint: function easeInQuint(t) {
                  return t * t * t * t * t;
              },
              easeOutQuint: function easeOutQuint(t) {
                  return 1 + (--t) * t * t * t * t;
              },
              easeInOutQuint: function easeInOutQuint(t) {
                  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
              }
          };

          var start = window.pageYOffset;
          var startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

          var documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
          var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
          var destinationOffset = typeof destination === 'number' ? destination : getPosition(destination).y - 20;
          var destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

          if ('requestAnimationFrame' in window === false) {
              window.scroll(0, destinationOffsetToScroll);
              if (callback) {
                  callback();
              }
              return;
          }

          function scroll() {
              var now = 'now' in window.performance ? performance.now() : new Date().getTime();
              var time = Math.min(1, ((now - startTime) / duration));
              var timeFunction = easings[easing](time);
              window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

              if (window.pageYOffset === destinationOffsetToScroll) {
                  if (callback) {
                      callback();
                  }
                  return;
              }

              requestAnimationFrame(scroll);
          }

          scroll();
      }

    function tbBorder (el) {
      var margin = el.offsetHeight - el.clientHeight;
      return margin;
    }

    function lrBorder (el) {
      var margin = el.offsetWidth - el.clientWidth;
      return margin;
    }

    function outerHeight (el) {
      var height = el.offsetHeight;
      var style = el.currentStyle || getComputedStyle(el);

      height += parseInt(style.marginTop) + parseInt(style.marginBottom);
      return height;
    }

    function outerWidth (el) {
      var width = el.offsetWidth;
      var style = el.currentStyle || getComputedStyle(el);

      width += parseInt(style.marginLeft) + parseInt(style.marginRight);
      return width;
    }

    // Check all answers
    function checkAllAnswered () {
      var answered = 0;
      if (!isMultiple) {
        for (i = 0; i < iterations.length; i++) {
          if (iterations[i].id.value !== '') answered++;
        }
      } else {
        for (i = 0; i < iterations.length; i++) {
          if (iterations[i].items[0].element.value !== '') answered++;
        }
      }
      return answered;
    }

    // Go to the next loop iteration
    function nextIteration () {

      for (i = 0; i < responseItems.length; i++) {
        removeEvent(responseItems[i], 'click');
      }

      currentIteration++;
      var width = (getStatementWidth() - 3),
        css = {
          opacity: 0,
          left: '-=' + width,
          width: width
        };
      if (currentIteration > (iterations.length - 1)) {

        if (autoForward) {

          //$container.find('.statement').animate(css, options.animationSpeed);
          container.querySelector('.statement').style.opacity = css.opacity;

          var leftPos = container.querySelector('.statement').style.left;
          container.querySelector('.statement').style.left = -outerWidth(container) + 'px';
          container.querySelector('.statement').style.width = css.width + 'px';
          setTimeout(function () {
            container.querySelector('.statement').style.left = 0 + 'px';
            nextBtn.click();
          }, 200);

        } else {
          currentIteration--;
          for (i = 0; i < nextStatements.length; i++) {
            if (nextStatements[i].style.display !== 'none') {
              nextStatements[i].style.display = 'none';
            }
          }
          nextBtn.click();
        }
        return;
      } else {
        if (currentIteration === (iterations.length - 1) && hideNextBtn === 'Until All items displayed') enableNext();
        if (scrollToTop) {
          var elem = document.documentElement || document.body;
          scrollIt(0, 600, 'easeOutQuad');
        }
      }
      removeClass(container.querySelector('.statement'), 'animate');
      updateNavigation();

      container.querySelector('.statement').style.width = width + 'px';

      //$container.find('.statement').css('width',width).animate(css, options.animationSpeed, onAnimationComplete);
      container.querySelector('.statement').style.opacity = css.opacity;
      container.querySelector('.statement').style.width = css.width + 'px';
      onAnimationComplete();
      addClass(container.querySelector('.statement'), 'animate');
      var leftPos = container.querySelector('.statement').style.left;
      container.querySelector('.statement').style.left = -outerWidth(container) + 'px';

      setTimeout(function () {
        container.querySelector('.statement').style.left = 0 + 'px';
        //onAnimationComplete();
      }, 200);

    }

    // After the previous/next animation
    function onAnimationComplete () {
      if (isMultiple) displayIterationMultiple();
      else displayIterationSingle();

      var width = getStatementWidth(),
        css = {
          opacity: 1,
          left: '+=' + width,
          width: width
        };

      //$container.find('.statement').animate(css, options.animationSpeed);
      container.querySelector('.statement').style.opacity = css.opacity;
      container.querySelector('.statement').style.width = css.width + 'px';
      var leftPos = container.querySelector('.statement').style.left;
      container.querySelector('.statement').style.left = 0 + 'px';
    }

    // Display the right loop caption and the right responses
    function displayIterationSingle () {

      for (i = 0; i < responseItems.length; i++) {
        responseItems[i].onclick = function (e) {
          (!isMultiple) ? selectStatementSingle(this) : selectStatementMulitple(this);
        };
      }

      if (showCounter) {
        if (options.countDirection === 'count down') {
            if (chineseCounter) {
                container.querySelector('.counterNumber').textContent = (iterations.length - currentIteration - 1).toLocaleString("zh-Hans-CN-u-nu-hanidec");
            } else {
            	container.querySelector('.counterNumber').textContent = (iterations.length - currentIteration - 1);
            }
        } else {
            if (chineseCounter) {
            	container.querySelector('.counterNumber').textContent = (currentIteration + 1).toLocaleString("zh-Hans-CN-u-nu-hanidec");
            } else {
            	container.querySelector('.counterNumber').textContent = (currentIteration + 1);
            }
        }
      }

      // Display the info of the current loop iteration
      for (i = 0; i < statementTexts.length; i++) {
        statementTexts[i].style.display = 'none';
        statementTexts[i].style.filter = '';
      }
      container.querySelector('.statement_text[data-id="' + (currentIteration + 1) + '"]').style.display = '';

      if(statementImages.length != 0){
        for (i = 0; i < statementImages.length; i++) {
          statementImages[i].style.display = 'none';
          statementImages[i].style.filter = '';
        }

        try {
          container.querySelector('.statement_image[data-id="' + (currentIteration + 1) + '"]').style.display = '';
        } catch (e) {}
      }

      // add alt here
      if (useAltColour) {
        if ((currentIteration % 2) === 0) {
          removeClass(container.querySelector('.statement'), 'altStatement');
          addClass(container.querySelector('.statement'), 'evenStatement');
        } else {
          removeClass(container.querySelector('.statement'), 'evenStatement');
          addClass(container.querySelector('.statement'), 'altStatement');
        }
      } else {
        addClass(container.querySelector('.statement'), 'evenStatement');
      }

      var currentValues = iterations[currentIteration].id.value;

      for (i = 0; i < responseItems.length; i++) {
        var value = responseItems[i].getAttribute('data-value'),
          isSelected = (currentValues.indexOf(value) != -1);

        if (isSelected) {
          addClass(responseItems[i], 'selected');
        } else {
          removeClass(responseItems[i], 'selected');
        }
      }

      if (iterations[currentIteration].id.value == '') {
        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = 'none';
        }
      } else if (options.topButtons != 'hide both' || options.bottomButtons != 'hide both') {
        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = '';
          nextStatements[i].style.visibility = 'visible';
        }
      }
    }

    // Display the right loop caption and the right responses
    function displayIterationMultiple () {

      for (i = 0; i < responseItems.length; i++) {
        responseItems[i].onclick = function (e) {
          (!isMultiple) ? selectStatementSingle(this) : selectStatementMulitple(this);
        };
      }

      if (showCounter) {
        if (options.countDirection === 'count down') container.querySelector('.counterNumber').textContent = (iterations.length - currentIteration - 1);
        else container.querySelector('.counterNumber').textContent = (currentIteration + 1);
      }

      // Display the info of the current loop iteration
      for (i = 0; i < statementTexts.length; i++) {
        statementTexts[i].style.display = 'none';
        statementTexts[i].style.filter = '';
      }
      container.querySelector('.statement_text[data-id="' + (currentIteration + 1) + '"]').style.display = '';

      if(statementImages.length != 0){
        for (i = 0; i < statementImages.length; i++) {
          statementImages[i].style.display = 'none';
          statementImages[i].style.filter = '';
        }

        try {
          container.querySelector('.statement_image[data-id="' + (currentIteration + 1) + '"]').style.display = '';
        } catch (e) {}
      }

      // add alt here
      if (useAltColour) {
        if ((currentIteration % 2) == 0) {
          removeClass(container.querySelector('.statement'), 'altStatement');
          addClass(container.querySelector('.statement'), 'evenStatement');
        } else {
          removeClass(container.querySelector('.statement'), 'evenStatement');
          addClass(container.querySelector('.statement'), 'altStatement');
        }
      } else {
        addClass(container.querySelector('.statement'), 'evenStatement');
      }

      for (i = 0; i < responseItems.length; i++) {
        removeClass(responseItems[i], 'selected');
      }

      var currentValues = iterations[currentIteration].items[0].element.value.split(','),
        currentValue;

      for (var j = 0; j < currentValues.length; j++) {

        currentValue = currentValues[j];

        for (i = 0; i < responseItems.length; i++) {

          var value = responseItems[i].getAttribute('data-value'),
            isSelected = responseItems[i].getAttribute('data-value') == currentValue ? true : false;

          if (isSelected) addClass(responseItems[i], 'selected');
        }

      }

      if (currentValue == '') {
        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = 'none';
        }
      }
    }

    function hideResponses () {

      for (i = 0; i < responseItems.length; i++) {
        removeEvent(responseItems[i], 'click');
        removeClass(responseItems[i], 'selected');
        /*$container.removeClass('selected').off('click').animate({
					opacity: 0,
					left: '-=' + $container.outerWidth()
				}, options.animationSpeed );*/
        var leftPos = container.querySelector('.statement').style.left;
        container.querySelector('.statement').style.left = -outerWidth(container) + 'px';

      }
	  var elem = document.documentElement || document.body;
      if (scrollToTop) scrollIt(0, 600, 'easeOutQuad');
      nextBtn.click();

    }

    // Horizontal layout
    if (useHLayout) {
      for (i = 0; i < responseItems.length; i++) {
        responseItems[i].style.width = options.responseWidth;
        responseItems[i].style.float = 'left';
        responseItems[i].style.clear = 'none';
        responseItems[i].style.margin = responseMargin;
      }
      var height = responseItems[0].offsetHeight;
      var maxResponseHeight = responseItems[0].offsetHeight;
      for (i = 0; i < responseItems; i++) {
        maxResponseHeight = Math.max(height, responseItems[i].offsetHeight);
      }
      for (i = 0; i < responseItems.length; i++) {
        responseItems[i].style.height = maxResponseHeight + 'px';
      }
    }

    // Attach all events
    for (i = 0; i < prevStatements.length; i++) {
      addEvent(prevStatements[i], 'click', previousIteration);
    }

    for (i = 0; i < nextStatements.length; i++) {
      addEvent(nextStatements[i], 'click', nextIteration);
    }

    // Refresh the current status on load
    if (isMultiple)      {
      displayIterationMultiple();
    }    else      {
      displayIterationSingle();
    }

    if (isMultiple || (!isMultiple && (options.topButtons != 'hide both' || options.bottomButtons != 'hide both'))) {

      if (currentIteration === 0) {
        for (i = 0; i < prevStatements.length; i++) {
          prevStatements[i].style.display = 'none';
        }
      }
      for (i = 0; i < nextStatements.length; i++) {
        nextStatements[i].style.display = 'block';
        nextStatements[i].style.marginLeft = '10px';
        nextStatements[i].style.float = 'right';
      }

      var nextStatementWidth = (container.querySelector('.nextStatement.top') ? outerWidth(container.querySelector('.nextStatement.top')) : 0);
      container.querySelector('.statement').style.width =
        container.clientWidth - (nextStatementWidth + 2 + lrBorder(document.querySelector('.statement'))) + 'px';
      container.querySelector('.statement').style.float = 'left';

      for (i = 0; i < nextStatements.length; i++) {
        nextStatements[i].style.height = container.querySelector('.statement').clientHeight + 'px';
      }
      for (i = 0; i < prevStatements.length; i++) {

        prevStatements[i].style.display = 'block';
        prevStatements[i].style.marginRight = '10px';
        prevStatements[i].style.float = 'left';
        prevStatements[i].style.height = container.querySelector('.statement').clientHeight + 'px';
        prevStatements[i].style.display = 'none';
      }

      if (iterations[currentIteration].value == '' && !isMultiple) {
        for (i = 0; i < nextStatements.length; i++) {
          nextStatements[i].style.display = 'none';
        }
      } else if (isMultiple) {
        if (iterations[currentIteration].items[0].element.value == '') {
          for (i = 0; i < nextStatements.length; i++) {
            nextStatements[i].style.display = 'none';
          }
        }
      }
    }

    if (isMultiple) {
      for (i = 0; i < responseItems.length; i++) {
        if (hasClass(responseItems[i], 'exclusive')) addClass(responseItems[i], 'cb')
        responseItems[i].style.height = maxResponseHeight + 'px';
      }
    }

    for (var i = 0; i < iterations.length; ++i) {
      if ((!isMultiple && iterations[i].id.value == '') || (isMultiple && iterations[currentIteration].items[0].element.value == '')) {
        if (i === 0) {
          break;
        }
        if (currentIteration <= iterations.length) {
         currentIteration = (i - 1);
        } else {
         currentIteration--;
        }
        nextIteration();
        break;
      } else {
		if (isMultiple && (i === (iterations.length - 1))) {
          currentIteration--;
          nextIteration();
          break;
        } else if (isMultiple && (i !== (iterations.length - 1))) {
          currentIteration++;
        } else if (currentIteration < (iterations.length - 1)) {
          currentIteration++;
          // nextIteration();
        } else {
          currentIteration--;
          nextIteration();
          break;
        }
      }
    }
    setTimeout(function(){ document.querySelector("#adc_" + this.instanceId).style.visibility = 'visible'; }, 300);
  }

  window.StatementList = StatementsList;
}());
