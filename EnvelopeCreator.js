//------------------------------------------------------------------------------
//------- ENVELOPE CREATOR.
//------------------------------------------------------------------------------
function private_EnvelopeCreator_ui( ){

  var input_ui = EnvelopeCreator().getPluginPath() + "/resources/EnvelopeCreator.ui";

  this.ui_path = input_ui;

  if( !File(input_ui).exists ){
    MessageBox.information( "Error: UI file doesn't exist." );
    return;
  }

  this.ui = UiLoader.load( this.ui_path );

  //CONNECT ALL THE BUTTONS, EVENTS, ECT.

  // discSpacing_spin
  // concaveSmoothing_spin
  // deformationPoints_spin
  // pivotShift_spin custom
  // smoothPasses_spin
  // expand_spin

  // discSpacing_slider
  // concaveSmoothing_slider
  // deformationPoints_slider
  // pivotShift_slider custom
  // smoothPasses_slider
  // expand_slider


  var _main    = this;
  var _main_ui = this.ui;
  this.locked = false;

  _main.getCurrentEnvelopeDetails = function( preview, args, pt_args ){
    //IDENTIFY SELECTION.

    //IF PREVIEW -- FIRST SELECTED ELEMENT
    //IF NOT     -- ALL ELEMENTS
    var _frm = frame.current();

    var _selcount = selection.numberOfNodesSelected();
    if( _selcount == 0){
      return { "success":false, "error":"Error: Nothing selected." };
    }

    var _valid_drawings = [];

    for( var n=0;n<_selcount;n++){
      var _node = selection.selectedNode(n);

      var _ntype = node.type(_node);
      if( _ntype.toUpperCase() == "READ" ){
        //Its a read module, confirm that it is a TVG.

        var columnId = node.linkedColumn(_node,"DRAWING.ELEMENT");
        var columnName = column.getDisplayName(columnId);
        var elementID = column.getElementIdOfDrawing(columnId);

        var drawingName = column.getDrawingName(columnId, _frm);
        var _ucsplit = drawingName.toUpperCase().split(".");
        if( _ucsplit[_ucsplit.length-1] == ("TVG") ){
          // WE CAN ASSUME VALID

          var _env = EnvelopeCreator().getDrawingBezierPath( _node,
                                     _frm,    //FRAME
                                     args[0],    //DISCRETIZER
                                     args[1],    //K
                                     args[2],      //DESIRED POINT COUNT
                                     args[3],   //BLUR
                                     args[4],     //EXPAND
                                     args[5],    //SINGLELINE
                                     args[6],    //USE MIN POINTS,
                                     args[7],    //ADDITIONAL BISSECTING

                                     pt_args
                                  );

          var obj = { "path":_node, "details": _env, "frame": _frm };
          _valid_drawings.push( obj );

          if(preview){
            break;
          }
        }
      }
    }

    if( _valid_drawings.length == 0 ){
      return { "success":false, "error":"No valid drawings detected." };
    }

    return { "success":true, "results":_valid_drawings };
  }

  //--------------
  // Placeholder for drawing a 'preview' window for the path.
  // _main.drawEnvelopeGUI = function(){
    // var _envelope = _main.getCurrentEnvelopeDetails( true, _main.getValues );

    // if( _envelope.success){
      // for( n in _main_ui.graphicsView ){
        // System.println( n );
      // }

      // //System.println( _main_ui.graphicsView.setScene );

      // // var scn = new QGraphicsScene();
      // // _main_ui.graphicsView.setScene( scn );

    // }else{

      // //_main_ui.informationLabel.text = _envelope.error;

    // }
  // }


  //-------------------------
  // SAVE PREFERENCES

  _main.savePreferences = function(){
    // System.println("SAVING PREF");

    try{

      preferences.setDouble( 'envelopeCreator_discSpacing', _main_ui.discSpacing_spin.value );
      preferences.setDouble( 'envelopeCreator_concSmooth', _main_ui.concaveSmoothing_spin.value );
      preferences.setInt( 'envelopeCreator_defPoints', _main_ui.deformationPoints_spin.value );
      preferences.setInt( 'envelopeCreator_pivotShift', _main_ui.pivotShift_spin.value ); // custom
      preferences.setInt( 'envelopeCreator_smoothPass', _main_ui.smoothPasses_spin.value );
      preferences.setDouble( 'envelopeCreator_expandVal', _main_ui.expand_spin.value );
      preferences.setInt( 'envelopeCreator_bisectval', _main_ui.bisect_spin.value );

      preferences.setBool( 'envelopeCreator_useMinPoint', _main_ui.useMinimumPoints.checked  );
      preferences.setBool( 'envelopeCreator_optimizeHandle', _main_ui.optimizeHandles.checked );
      preferences.setBool( 'envelopeCreator_single', _main_ui.singleCurveCheck.checked );
      preferences.setBool( 'envelopeCreator_shapeNetwork', _main_ui.buildDeformShape.checked );

      preferences.setBool( 'envelopeCreator_globalTransform', _main_ui.gobalTransform.checked );
    }catch(err){
      System.println( err );
    }

    //preferences.setBool( 'envelopeCreator_autoOrient', _main_ui.autoOrientCheck.checked );
  }

  _main.updateUI = function( _main ){
    // //_main_ui.informationLabel.text = "Updating. . .";
    // _main.drawEnvelopeGUI();

    _main.savePreferences();
  }

  //Pseudo mutex to prevent firing events from modifying values.
  _main.ui_lock = function() {
    if(_main.locked){
        return false;
      }

    _main.locked = true;
    return true;
  }

  _main.ui_unlock = function(){
    _main.locked = false;
  }

  _main.getValues = function(){
    return [
        _main_ui.discSpacing_spin.value,
        _main_ui.concaveSmoothing_spin.value,
        _main_ui.deformationPoints_spin.value,
        _main_ui.smoothPasses_spin.value,
        _main_ui.expand_spin.value,
        _main_ui.singleCurveCheck.checked,
        _main_ui.useMinimumPoints.checked,
        _main_ui.bisect_spin.value,
        //_main_ui.autoOrientCheck.checked,
         ];
  }

  _main_ui.freezeEvents = false;

  var init_slidermatch = function( spin, slider ){
    _main.ui_lock();

    var _spin   = spin;
    var _slider = slider;

    var perc = ( spin.value - _spin.minimum) / (_spin.maximum-_spin.minimum);
    var newValue = ( (_slider.maximum-_slider.minimum)*perc ) + _slider.minimum;
    _slider.setValue( newValue );

    _main.updateUI( _main );

    _main.ui_unlock();
  }

  var pref_envelopeCreator_discSpacing  = preferences.getDouble( 'envelopeCreator_discSpacing', 30.0 );
  var pref_envelopeCreator_concSmooth   = preferences.getDouble( 'envelopeCreator_concSmooth', 0 );
  var pref_envelopeCreator_defPoints    = preferences.getInt( 'envelopeCreator_defPoints', 4 );
  var pref_envelopeCreator_pivotShift   = preferences.getInt( 'envelopeCreator_pivotShift', 0 ); // custom
  var pref_envelopeCreator_smoothPass   = preferences.getInt( 'envelopeCreator_smoothPass', 0 );
  var pref_envelopeCreator_expand       = preferences.getDouble( 'envelopeCreator_expandVal', 0 );
  var pref_envelopeCreator_bisect       = preferences.getInt( 'envelopeCreator_bisectval', 0 );

  var pref_envelopeCreator_single       = preferences.getBool( 'envelopeCreator_single', false );
  var pref_envelopeCreator_shapeNetwork = preferences.getBool( 'envelopeCreator_shapeNetwork', false );
  var pref_envelopeCreator_useCorners   = preferences.getBool( 'envelopeCreator_useMinPoint', false );
  var pref_envelopeCreator_optiHandles  = preferences.getBool( 'envelopeCreator_optimizeHandle', false );
  //var pref_envelopeCreator_autoOrient    = preferences.getBool( 'envelopeCreator_autoOrient', true );

  var pref_envelopeCreator_globalTransform  = preferences.getBool( 'envelopeCreator_globalTransform', true );
  var pref_hasNewFeaturesPreview        = preferences.getBool( 'TB_HAS_NEW_FEATURES_PREVIEW', false );

  _main_ui.discSpacing_spin.value       = pref_envelopeCreator_discSpacing;
  _main_ui.concaveSmoothing_spin.value  = pref_envelopeCreator_concSmooth;
  _main_ui.deformationPoints_spin.value = pref_envelopeCreator_defPoints;
  _main_ui.pivotShift_spin.value        = pref_envelopeCreator_pivotShift; // custom
  _main_ui.smoothPasses_spin.value      = pref_envelopeCreator_smoothPass;
  _main_ui.expand_spin.value            = pref_envelopeCreator_expand;
  _main_ui.bisect_spin.value            = pref_envelopeCreator_bisect;

  _main_ui.singleCurveCheck.checked     = pref_envelopeCreator_single;
  _main_ui.buildDeformShape.checked     = pref_envelopeCreator_shapeNetwork;
  //_main_ui.autoOrientCheck.checked      = pref_envelopeCreator_autoOrient;
  _main_ui.useMinimumPoints.checked     = pref_envelopeCreator_useCorners;
  _main_ui.optimizeHandles.checked      = pref_envelopeCreator_optiHandles;

  _main_ui.gobalTransform.checked       = pref_envelopeCreator_globalTransform;

  init_slidermatch( _main_ui.discSpacing_spin, _main_ui.discSpacing_slider );
  init_slidermatch( _main_ui.concaveSmoothing_spin, _main_ui.concaveSmoothing_slider );
  init_slidermatch( _main_ui.deformationPoints_spin, _main_ui.deformationPoints_slider );
  init_slidermatch( _main_ui.pivotShift_spin, _main_ui.pivotShift_slider ); // custom
  init_slidermatch( _main_ui.smoothPasses_spin, _main_ui.smoothPasses_slider );
  init_slidermatch( _main_ui.expand_spin, _main_ui.expand_slider );
  init_slidermatch( _main_ui.bisect_spin, _main_ui.bisect_slider );

  //-------------------
  // SLIDER CONNECTIONS
  _connect_spin_slider = function( spin, slider, _main ){
    var funcret = function( value ){
      try{
        if( !_main.ui_lock() ){
          return;
        }

        var _spin   = spin;
        var _slider = slider;

        var perc = (value - _spin.minimum) / (_spin.maximum-_spin.minimum);

        var newValue = ( (_slider.maximum-_slider.minimum)*perc ) + _slider.minimum;
        _slider.setValue( newValue );

        _main.updateUI( _main );
      }catch(err){
        System.println( err );
      }

      _main.ui_unlock();
    }

    return funcret;
  }


  _connect_slider_spin = function( spin, slider, _main ){
    var funcret = function( value ){
      try{
        if( !_main.ui_lock() ){
          return;
        }

        var _spin   = spin;
        var _slider = slider;

        var perc = (value - _slider.minimum) / (_slider.maximum-_slider.minimum);

        var newValue = ( (_spin.maximum-_spin.minimum)*perc ) + _spin.minimum;

        _spin.setValue( newValue );

        _main.updateUI( _main );
      }catch(err){
        System.println( err );
      }

      _main.ui_unlock();
    }
    return funcret;
  }

  //------------------------------
  // BUILDING

  _main.createEnvelopes = function( pt_args ){
    try{
      _main.savePreferences();

      _main.locked = true;  //Force the mutex lock.
      //MessageBox.information( "CREATE THE ENVELOPE" );

      var _envelope = _main.getCurrentEnvelopeDetails( false, _main.getValues(), pt_args );
      if( _envelope.success){


        scene.beginUndoRedoAccum("Create Deformations");
        for( var n=0;n<_envelope.results.length;n++){
          //_main_ui.informationLabel.text = ""+n;

          _main.createEnvelope( _envelope.results[n].path, _envelope.results[n].details, _envelope.results[n].frame,
                      _main_ui.buildDeformShape.checked,
                      _main_ui.optimizeHandles.checked,
                      _main_ui.gobalTransform.checked
                    );
        }
        scene.endUndoRedoAccum();
        Action.perform("onActionShowSelectedDeformers()", "miniPegModuleResponder");

      }else{

        //_main_ui.informationLabel.text = _envelope.error;
        MessageBox.information( _envelope.error );  //Already translated in script via tr()

      }
      //_main_ui.informationLabel.text = "";

      _main.ui_unlock();
    }catch(err){
      System.println( err );
    }
  }

  _main.createEnvelopesSource = function( ){
    //Fetch the source via a path interface.

    Action.perform( "onActionChoosePencilTool()" );

    try{
      var _frm = frame.current();
      var _selcount = selection.numberOfNodesSelected();
      if( _selcount == 0 ){
        MessageBox.information( "Error: Nothing selected." );
        _main_ui.create_buttonWithSource.text = _main_ui.create_buttonWithSource.textOriginal;
        _main_ui.create_buttonWithSource.enabled = true;
        return;
      }

      var _nodes = [];
      for( var n=0;n<_selcount;n++){
        var _node = selection.selectedNode(n);
        var _ntype = node.type(_node);
        if( _ntype.toUpperCase() == "READ" ){
          var columnId = node.linkedColumn(_node,"DRAWING.ELEMENT");
          var columnName = column.getDisplayName(columnId);
          var elementID = column.getElementIdOfDrawing(columnId);

          var drawingName = column.getDrawingName(columnId, _frm);
          var _ucsplit = drawingName.toUpperCase().split(".");
          if( _ucsplit[_ucsplit.length-1] == ("TVG") ){
            _nodes.push( _node );
          }
        }
      }

      //No valid nodes
      if( _nodes.length == 0 ){
        _main.ui_unlock();
        _main_ui.create_buttonWithSource.text = _main_ui.create_buttonWithSource.textOriginal;
        _main_ui.create_buttonWithSource.enabled = true;
        MessageBox.information( "Error: No valid drawings selected." );
        return;
      }

      //CHANGE LABEL, LOCK THE BUTTON.
      _main_ui.create_buttonWithSource.enabled = false;
      _main_ui.create_buttonWithSource.text = EnvelopeCreator().getString(0);  //Get the translated string.

      if( _main_ui.singleCurveCheck.checked ){
        //New type of interaction.

        cb_arg = function( _results ){
          var lastClick = _results;

          cb_arg2 = function( _results ){
            lastClick.push(_results[0]);
            _main_ui.create_buttonWithSource.text = _main_ui.create_buttonWithSource.textOriginal;
            _main_ui.create_buttonWithSource.enabled = true;
            _main.createEnvelopes(lastClick);
          }

          var _drawType = 2;  //RELEASE
          var _env = EnvelopeCreator().drawPathOverlay( cb_arg2, _drawType );
        }

        var _drawType = 2;  //RELEASE
        var _env = EnvelopeCreator().drawPathOverlay( cb_arg, _drawType );

      }else{
        cb_arg = function( _results ){
          _main_ui.create_buttonWithSource.text = _main_ui.create_buttonWithSource.textOriginal;
          _main_ui.create_buttonWithSource.enabled = true;
          _main.createEnvelopes(_results);
        }

        var _drawType = 2;  //RELEASE
        var _env = EnvelopeCreator().drawPathOverlay( cb_arg, _drawType );
      }

    }catch(err){
      System.println( err );

    }
  }

  _main_ui.create_buttonWithSource.textOriginal = _main_ui.create_buttonWithSource.text;
  _main_ui.create_buttonWithSource.visible = pref_hasNewFeaturesPreview;

  //_main_ui.informationLabel.text = "Initializing. . .";
  _main_ui.discSpacing_spin['valueChanged(double)'].connect( this, _connect_spin_slider(_main_ui.discSpacing_spin, _main_ui.discSpacing_slider, _main) );
  _main_ui.discSpacing_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.discSpacing_spin, _main_ui.discSpacing_slider, _main) );

  _main_ui.concaveSmoothing_spin['valueChanged(double)'].connect( this, _connect_spin_slider(_main_ui.concaveSmoothing_spin, _main_ui.concaveSmoothing_slider, _main) );
  _main_ui.concaveSmoothing_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.concaveSmoothing_spin, _main_ui.concaveSmoothing_slider, _main) );

  _main_ui.deformationPoints_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.deformationPoints_spin, _main_ui.deformationPoints_slider, _main) );
  _main_ui.deformationPoints_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.deformationPoints_spin, _main_ui.deformationPoints_slider, _main) );

  _main_ui.pivotShift_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.pivotShift_spin, _main_ui.pivotShift_slider, _main) ); // custom
  _main_ui.pivotShift_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.pivotShift_spin, _main_ui.pivotShift_slider, _main) ); // custom

  _main_ui.smoothPasses_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.smoothPasses_spin, _main_ui.smoothPasses_slider, _main) );
  _main_ui.smoothPasses_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.smoothPasses_spin, _main_ui.smoothPasses_slider, _main) );

  _main_ui.expand_spin['valueChanged(double)'].connect( this, _connect_spin_slider(_main_ui.expand_spin, _main_ui.expand_slider, _main) );
  _main_ui.expand_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.expand_spin, _main_ui.expand_slider, _main) );

  _main_ui.bisect_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.bisect_spin, _main_ui.bisect_slider, _main) );
  _main_ui.bisect_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.bisect_spin, _main_ui.bisect_slider, _main) );


  _main_ui.singleCurveCheck['clicked'].connect( this, function(arg){_main.updateUI(_main)} );
  _main_ui.buildDeformShape['clicked'].connect( this, function(arg){_main.updateUI(_main)} );
  _main_ui.useMinimumPoints['clicked'].connect( this, function(arg){_main.updateUI(_main)} );
  _main_ui.optimizeHandles['clicked'].connect(  this, function(arg){_main.updateUI(_main)} );
  _main_ui.gobalTransform['clicked'].connect(  this, function(arg){_main.updateUI(_main)} );


  _main_ui.create_button['clicked'].connect( this, _main.createEnvelopes );
  _main_ui.create_buttonWithSource['clicked'].connect( this, _main.createEnvelopesSource );

  //_main_ui.informationLabel.text = "";
  // _main_ui.create_button['clicked'].connect( this, _main.updateUI );
  //_main.drawEnvelopeGUI();
}

//------------------------------------------------------------------------------
//------- ENVELOPE DRAWER.
//------------------------------------------------------------------------------
function private_EnvelopeDrawer_ui( ){

  var input_ui = EnvelopeCreator().getPluginPath() + "/resources/EnvelopeDrawer.ui";

  this.ui_path = input_ui;

  if( !File(input_ui).exists ){
    MessageBox.information( "Error: UI file doesn't exist." );
    return;
  }

  this.ui = UiLoader.load( this.ui_path );

  //CONNECT ALL THE BUTTONS, EVENTS, ECT.
  var _main    = this;
  var _main_ui = this.ui;
  this.locked = false;

  _main.lastPath = false;

  //--------------
  // Placeholder for drawing a 'preview' window for the path.
  // _main.drawEnvelopeGUI = function(){
    // var _envelope = _main.getCurrentEnvelopeDetails( true, _main.getValues );

    // if( _envelope.success){
      // for( n in _main_ui.graphicsView ){
        // System.println( n );
      // }

      // //System.println( _main_ui.graphicsView.setScene );

      // // var scn = new QGraphicsScene();
      // // _main_ui.graphicsView.setScene( scn );

    // }else{

      // //_main_ui.informationLabel.text = _envelope.error;

    // }
  // }

  //-------------------------
  // SAVE PREFERENCES
  _main.savePreferences = function(){
    //preferences.setDouble( 'envelopeDrawer_discSpacing', _main_ui.discSpacing_spin.value );
    preferences.setInt( 'envelopeDrawer_defPoints', _main_ui.deformationPoints_spin.value );
    preferences.setInt( 'envelopeDrawer_smoothPass', _main_ui.smoothPasses_spin.value );
    preferences.setInt( 'envelopeDrawer_bisectval', _main_ui.bisect_spin.value );

    preferences.setBool( 'envelopeDrawer_useMinPoint', _main_ui.useMinimumPoints.checked  );
    preferences.setBool( 'envelopeDrawer_single', _main_ui.singleCurveCheck.checked );
    preferences.setBool( 'envelopeDrawer_shapeNetwork', _main_ui.buildDeformShape.checked );
    preferences.setBool( 'envelopeDrawer_optimizeHandle', _main_ui.optimizeHandles.checked );

    preferences.setBool( 'envelopeCreator_globalTransform', _main_ui.gobalTransform.checked );
  }

  _main.updateUI = function( _main ){
    // //_main_ui.informationLabel.text = "Updating. . .";
    // _main.drawEnvelopeGUI();

    _main.savePreferences();
  }

  //Pseudo mutex to prevent firing events from modifying values.
  _main.ui_lock = function() {
    if(_main.locked){
        return false;
      }

    _main.locked = true;
    return true;
  }

  _main.ui_unlock = function(){
    _main.locked = false;
  }

  _main.getValues = function(){
    return [
        //_main_ui.discSpacing_spin.value,
        _main_ui.deformationPoints_spin.value,
        _main_ui.smoothPasses_spin.value,
        !_main_ui.singleCurveCheck.checked,
        _main_ui.useMinimumPoints.checked,
        _main_ui.bisect_spin.value
         ];
  }

  _main_ui.freezeEvents = false;

  var init_slidermatch = function( spin, slider ){
    _main.ui_lock();

    var _spin   = spin;
    var _slider = slider;

    var perc = ( spin.value - _spin.minimum) / (_spin.maximum-_spin.minimum);
    var newValue = ( (_slider.maximum-_slider.minimum)*perc ) + _slider.minimum;
    _slider.setValue( newValue );

    _main.updateUI( _main );

    _main.ui_unlock();
  }

  //var pref_envelopeCreator_discSpacing  = preferences.getDouble( 'envelopeDrawer_discSpacing', 30.0 );
  var pref_envelopeCreator_defPoints        = preferences.getInt( 'envelopeDrawer_defPoints', 4 );
  var pref_envelopeCreator_smoothPass       = preferences.getInt( 'envelopeDrawer_smoothPass', 0 );
  var pref_envelopeCreator_bisect           = preferences.getInt( 'envelopeDrawer_bisectval', 0 );

  var pref_envelopeCreator_single           = preferences.getBool( 'envelopeDrawer_single', false );
  var pref_envelopeCreator_shapeNetwork     = preferences.getBool( 'envelopeDrawer_shapeNetwork', false );
  var pref_envelopeCreator_autOrient        = preferences.getBool( 'envelopeDrawer_autoOrient', true );
  var pref_envelopeCreator_useCorners       = preferences.getBool( 'envelopeDrawer_useMinPoint', false );
  var pref_envelopeCreator_optiHandles      = preferences.getBool( 'envelopeDrawer_optimizeHandle', false );

  var pref_envelopeCreator_globalTransform  = preferences.getBool( 'envelopeCreator_globalTransform', true );

  //_main_ui.discSpacing_spin.value       = pref_envelopeCreator_discSpacing;
  _main_ui.deformationPoints_spin.value = pref_envelopeCreator_defPoints;
  _main_ui.smoothPasses_spin.value      = pref_envelopeCreator_smoothPass;
  _main_ui.bisect_spin.value         = pref_envelopeCreator_bisect;

  _main_ui.singleCurveCheck.checked     = pref_envelopeCreator_single;
  _main_ui.buildDeformShape.checked     = pref_envelopeCreator_shapeNetwork;
  _main_ui.useMinimumPoints.checked     = pref_envelopeCreator_useCorners;
  _main_ui.optimizeHandles.checked      = pref_envelopeCreator_optiHandles;

  _main_ui.gobalTransform.checked       = pref_envelopeCreator_globalTransform;


  //init_slidermatch( _main_ui.discSpacing_spin, _main_ui.discSpacing_slider );
  init_slidermatch( _main_ui.deformationPoints_spin, _main_ui.deformationPoints_slider );
  init_slidermatch( _main_ui.smoothPasses_spin, _main_ui.smoothPasses_slider );
  init_slidermatch( _main_ui.bisect_spin, _main_ui.bisect_slider );

  //-------------------
  // SLIDER CONNECTIONS
  _connect_spin_slider = function( spin, slider, _main ){
    var funcret = function( value ){
      try{
        if( !_main.ui_lock() ){
          return;
        }

        var _spin   = spin;
        var _slider = slider;

        var perc = (value - _spin.minimum) / (_spin.maximum-_spin.minimum);

        var newValue = ( (_slider.maximum-_slider.minimum)*perc ) + _slider.minimum;
        _slider.setValue( newValue );

        _main.updateUI( _main );
      }catch(err){
        System.println( err );
      }

      _main.ui_unlock();
    }

    return funcret;
  }


  _connect_slider_spin = function( spin, slider, _main ){
    var funcret = function( value ){
      try{
        if( !_main.ui_lock() ){
          return;
        }

        var _spin   = spin;
        var _slider = slider;

        var perc = (value - _slider.minimum) / (_slider.maximum-_slider.minimum);

        var newValue = ( (_spin.maximum-_spin.minimum)*perc ) + _spin.minimum;

        _spin.setValue( newValue );

        _main.updateUI( _main );
      }catch(err){
        System.println( err );
      }

      _main.ui_unlock();
    }
    return funcret;
  }

  //------------------------------
  // BUILDING

  var local_access_creator = private_EnvelopeCreator_ui;
  _main.createEnvelopes = function( ){
    try{
      _main.savePreferences();

      var _selcount = selection.numberOfNodesSelected();
      if( _selcount == 0 ){
        MessageBox.information( "Error: Nothing selected." );
        return;
      }

      var _nodes = [];
      for( var n=0;n<_selcount;n++){
        var _node = selection.selectedNode(n);
        var _ntype = node.type(_node);
        if( _ntype.toUpperCase() == "READ" ){
          _nodes.push( _node );
        }
      }

      //No valid nodes
      if( _nodes.length == 0 ){
        _main.ui_unlock();
        MessageBox.information( "Error: No valid drawings selected." );
        return;
      }

      if(_main.locked){
        return false;
      }
      _main.locked = true;  //Force the mutex lock.

      //_main_ui.informationLabel.text = "Drawing Shape";

      //-----------------------------------------------------------------------------------------
      //-----------------------------------------------------------------------------------------
      var _ret = function( args ){
        _main_ui.create_button.text = _main_ui.create_button.textOriginal;
        _main_ui.create_button.enabled = true;

        //ALLOW REDRAW BUTTON
        _main.lastPath = args;
        _main_ui.rebuildButton.enabled = true;

        try{
          var _frm = frame.current();
          var def_args = _main.getValues();

          scene.beginUndoRedoAccum("Create Deformations");
          for(var nn=0;nn<_nodes.length;nn++){
            var _node = _nodes[nn];
            var _pth  = EnvelopeCreator().getOptimizedPath( _node,
                                    _frm,
                                    args,

                                    def_args[0],
                                    def_args[3],
                                    def_args[1],
                                    def_args[4],
                                    def_args[2]
                                     );

            if( !_pth.success ){
              MessageBox.information( _pth.error );
              return;
            }

            //Use the network envelope creator.
            local_access_creator.prototype.createEnvelope( _node, _pth,  _frm,
                            _main_ui.buildDeformShape.checked,
                            _main_ui.optimizeHandles.checked,
                            _main_ui.gobalTransform.checked  );
          }
          scene.endUndoRedoAccum();
          Action.perform("onActionShowSelectedDeformers()", "miniPegModuleResponder");

        }catch(err){
          System.println( err );
        }
      }

      var _drawType = 0;  //STANDARD PATH DRAWING.

      Action.perform( "onActionChoosePencilTool()" );

      _main_ui.create_button.enabled = false;
      _main_ui.create_button.text = EnvelopeCreator().getString(0);  //Get the translated string.
      var _env = EnvelopeCreator().drawPathOverlay( _ret, _drawType );

      //-----------------------------------------------------------------------------------------
      //-----------------------------------------------------------------------------------------

      //_main_ui.informationLabel.text = "";
      _main.ui_unlock();
    }catch(err){
      System.println( err );
    }
  }

  _main.recreateEnvelopes = function( ){
    if( !_main.lastPath ){
      MessageBox.information( "Error: No drawing information is available." );
      return;
    }


    _main.savePreferences();

    var _selcount = selection.numberOfNodesSelected();
    if( _selcount == 0 ){
      MessageBox.information( "Error: Nothing selected." );
      return;
    }

    var _nodes = [];
    for( var n=0;n<_selcount;n++){
      var _node = selection.selectedNode(n);
      var _ntype = node.type(_node);
      if( _ntype.toUpperCase() == "READ" ){
        //Its a read module, confirm that it is a TVG.
        _nodes.push( _node );
      }
    }

    //No valid nodes
    if( _nodes.length == 0 ){
      _main.ui_unlock();
      MessageBox.information( "Error: No valid drawings selected." );
      return;
    }

    if(_main.locked){
      // System.println( "UI Locked" );
      return false;
    }
    _main.locked = true;  //Force the mutex lock.

    //_main_ui.informationLabel.text = "Recreating Deformation";

    //-----------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------

    //ALLOW REDRAW BUTTON
    args = _main.lastPath;

    try{
      var _frm = frame.current();
      var def_args = _main.getValues();

      scene.beginUndoRedoAccum("Create Deformations");
      for(var nn=0;nn<_nodes.length;nn++){
        var _node = _nodes[nn];
        var _pth  = EnvelopeCreator().getOptimizedPath( _node,
                                _frm,
                                args,

                                def_args[0],
                                def_args[3],
                                def_args[1],
                                def_args[4],
                                def_args[2]
                                 );

        if( !_pth.success ){
          MessageBox.information( _pth.error );  //Already translated.
          return;
        }

        local_access_creator.prototype.createEnvelope( _node, _pth, _frm,
                            _main_ui.buildDeformShape.checked,
                            _main_ui.optimizeHandles.checked,
                            _main_ui.gobalTransform.checked );

      }
      scene.endUndoRedoAccum("Create Deformations");
      Action.perform("onActionShowSelectedDeformers()", "miniPegModuleResponder");

    }catch(err){
      System.println( err );
    }

    _main.ui_unlock();
  }


  _main_ui.create_button.textOriginal = _main_ui.create_button.text;

  //_main_ui.informationLabel.text = "Initializing. . .";

  //_main_ui.discSpacing_spin['valueChanged(double)'].connect( this, _connect_spin_slider(_main_ui.discSpacing_spin, _main_ui.discSpacing_slider, _main) );
  //_main_ui.discSpacing_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.discSpacing_spin, _main_ui.discSpacing_slider, _main) );

  _main_ui.deformationPoints_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.deformationPoints_spin, _main_ui.deformationPoints_slider, _main) );
  _main_ui.deformationPoints_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.deformationPoints_spin, _main_ui.deformationPoints_slider, _main) );

  _main_ui.smoothPasses_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.smoothPasses_spin, _main_ui.smoothPasses_slider, _main) );
  _main_ui.smoothPasses_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.smoothPasses_spin, _main_ui.smoothPasses_slider, _main) );

  _main_ui.bisect_spin['valueChanged(int)'].connect( this, _connect_spin_slider(_main_ui.bisect_spin, _main_ui.bisect_slider, _main) );
  _main_ui.bisect_slider['valueChanged(int)'].connect( this, _connect_slider_spin(_main_ui.bisect_spin, _main_ui.bisect_slider, _main) );

  _main_ui.singleCurveCheck['clicked'].connect( this, function(arg){_main.updateUI(_main)} );
  _main_ui.buildDeformShape['clicked'].connect( this, function(arg){_main.updateUI(_main)} );
  _main_ui.useMinimumPoints['clicked'].connect( this, function(arg){_main.updateUI(_main)} );
  _main_ui.optimizeHandles['clicked'].connect(  this, function(arg){_main.updateUI(_main)} );
  _main_ui.gobalTransform['clicked'].connect(  this, function(arg){_main.updateUI(_main)} );


  _main_ui.create_button['clicked'].connect( this, _main.createEnvelopes );
  _main_ui.rebuildButton['clicked'].connect( this, _main.recreateEnvelopes );


  //_main_ui.informationLabel.text = "";
}


  //-------------------------
  // FIND DEFORM ANY

private_EnvelopeCreator_ui.prototype.recurseParentFindDeformation = function( noden ){
  //DeformationCompositeModule
  var _deformationModuleTypes = [
                  "",
                  "CurveModule",
                  "AutoFoldModule",
                  "AutoMuscleModule",
                  "DeformationSwitchModule",
                  "DeformationScaleModule",
                  "FoldModule",
                  "DeformationWaveModule",
                  "CurveModule",
                  "OffsetModule",
                  "DeformationUniformScaleModule",
                  "ArticulationModule",
                  "BendyBoneModule",
          "DeformationCompositeModule",
                  ""
                  ];

  if( _deformationModuleTypes.join(",").indexOf(","+node.type( noden )+",") >= 0 ){
    return noden;
  }

  var _inpNum = node.numberOfInputPorts( noden );
  var _fnd = false;

  for( var n=0;n<_inpNum;n++ ){
    var _node_src = node.flatSrcNode( noden, n );
    if(_node_src && node.type( _node_src ) != "READ" ){
      var _node_n = this.recurseParentFindDeformation( _node_src );
      if( _node_n ){
        return _node_n;
      }
    }
  }

  return false;
}

//-------------------------
// FIND DEFORM COMP

private_EnvelopeCreator_ui.prototype.recurseParentFindDeformationComp = function( noden ){
  //DeformationCompositeModule

  if( node.type( noden ) == "DeformationCompositeModule" ){
    return noden;
  }

  var _inpNum = node.numberOfInputPorts( noden );
  var _fnd = false;

  for( var n=0;n<_inpNum;n++ ){
    var _node_src = node.flatSrcNode( noden, n );
    if(_node_src && node.type( _node_src ) != "READ" ){
      var _node_n = this.recurseParentFindDeformationComp( _node_src );
      if( _node_n ){
        return _node_n;
      }
    }
  }

  return false;
}



//-------------------------
// FIND TRANSFORMATION SWITCH COMP

private_EnvelopeCreator_ui.prototype.recurseParentTransformationSwitch = function( noden, tframe ){
  //DeformationCompositeModule

  if( node.type( noden ) == "TransformationSwitch" ){
  //FEED IT THE PATH OF THE ACTIVE TRANSFORMATION SWITCH
  var _inpNum = node.numberOfInputPorts( noden );

  var _col = node.linkedColumn(noden,"drawing.element");

  var drawingName = column.getDrawingName( _col, tframe );
  var _newDrawingName = [];
  var _splitDrawingName = drawingName.split(".");
  for( var n=0;n<_splitDrawingName.length-1;n++ ){
    _newDrawingName.push( _splitDrawingName[n] );
  }

  drawingName = _newDrawingName.join(".");
  drawingNameID = drawingName.split("-");
  drawingNameID = drawingNameID[drawingNameID.length-1];

  var _sel_inp = -1;
  var _size = _inpNum;
  for( var n=1; n<=_inpNum; n++ ){

    //transformation1
    var _tname = "transformationnames.transformation"+(n);
    var _transNames = node.getTextAttr( noden, tframe, _tname ).split(";");

    var found_inp = false;
    for( var ninp=0; ninp<_transNames.length;ninp++){
      if( _transNames[ninp] == drawingNameID ){
        found_inp = true;
        _sel_inp = n;
        break;
      }
    }
    if(found_inp){
      break;
    }
  }

  var _cmp = false;
  if( _sel_inp >= 0 ){
    var _node_src = node.flatSrcNode( noden, _sel_inp );
    if( _node_src ){
      var _deformationItem  = this.recurseParentFindDeformation( _node_src );
      if( _deformationItem ){
        return _node_src;
      }
    }

    if(!_node_src ){//IS IT A GROUP?
      var _node_src = node.srcNode( noden, _sel_inp );
    }

    _cmp = node.add( node.parentNode( noden ), 'DeformationComposite', "DeformationCompositeModule", node.coordX(noden), node.coordY(noden) - 300, 0);
    if( _node_src ){
      var _lnki = node.srcNodeInfo( noden, _sel_inp );

      node.link( _lnki.node, _lnki.port, _cmp, 0, false, true );

      node.unlink( noden, _sel_inp );
      node.link( _cmp, 0, noden, _sel_inp, false, false );
    }

  }

  if( _sel_inp == -1 ){
    _sel_inp = _inpNum;
  }

  var _node_src = node.flatSrcNode( noden, _sel_inp );
  if(!_node_src ){ //IS IT A GROUP?
    var _node_src = node.srcNode( noden, _sel_inp );
  }

  if( !_node_src ){
    _cmp = node.add( node.parentNode( noden ), 'DeformationComposite', "DeformationCompositeModule", node.coordX(noden), node.coordY(noden) - 300, 0);

    var _pnodei = node.getGroupInputModule( node.parentNode( noden ), "Multi-Port-In", 0, -500, 0 );

    node.link( _pnodei, 0, _cmp, 0, false, true );
    node.link( _cmp, 0, noden, _sel_inp, false, true );
  }

  if(!_cmp){
    return false;
  }

  var _tname = "transformationnames.transformation"+(_sel_inp);
  node.setTextAttr( noden, _tname, 1, drawingNameID+";" );

  var new_grp = node.createGroup( _cmp, _sel_inp );
  var _grp_pos = _sel_inp-1;
  var _grp_x = node.coordX(noden) - ( ( (_grp_pos%3) ) * 75 );
  var _grp_y = node.coordY(noden) - ( 400 ) + ( Math.floor(_grp_pos/3.0)*75 );
  node.setCoord( new_grp, _grp_x, _grp_y );

  var _node_src = node.flatSrcNode( noden, _sel_inp );

  node.unlink( _node_src, 0 );  //Prevent a direct attachment of mportin to composite internally.

    return _node_src;
  }

  var _inpNum = node.numberOfInputPorts( noden );
  var _fnd = false;

  for( var n=0;n<_inpNum;n++ ){
    var _node_src = node.flatSrcNode( noden, n );
    if(_node_src && node.type( _node_src ) != "READ" ){
      var _node_n = this.recurseParentTransformationSwitch( _node_src, tframe );
      if( _node_n ){
        return _node_n;
      }
    }
  }

  return false;
}



//IMPLEMENT GLOBAL TRANSFORM
//ADD SCALE MODULE IN SINGLE LINES.

//_main_ui.gobalTransform.checked
private_EnvelopeCreator_ui.prototype.createEnvelope = function( path, envelope_details, frame, _buildShaped, _optimizeHandles, _globalTransform ){
  if( !envelope_details.success ){
    MessageBox.information( envelope_details.error );  //Already translated.
    return;
  }

  var _closed    = envelope_details.closed;

  // custom start
  /** The envelope contains indexes corresponding to the points of the deformation chain with index 0, it seems, being the "OFFSET"/pivot.
   * "OFFSET" is the pivot/starting point of the deformation chain with an enlarged circle around it in the editor.
   * This shifts the indexes to the left by an amount (Pivot Shift) specified in the envelope creator dialog box
   * The purpose of this shift is to move the "OFFSET" point until we get to the desired position
   */
  var temp = [];
  var results_length = envelope_details.results.length;
  var results_lastIndex = envelope_details.results.length - 1;

  var clamped_pivotShift = Math.max(Math.min(this.ui.pivotShift_spin.value, results_lastIndex), 0);
  var shift = clamped_pivotShift % (results_length);

  for( var n = 0; n < results_length; n++ ){
    temp[n] = envelope_details.results[(n + shift) % (results_length)];
  }

  // MessageBox.information( temp.length )

  envelope_details.results = temp;
  // custom end

  //Fast deepcopy.
  var _path_global = JSON.parse(JSON.stringify(envelope_details.results));
  if(!_globalTransform){
    //Convert this to a localized transform.
    //Have to preoptimize handles here.
    if( _optimizeHandles ){
      //Pre-Optimize the handles

      var first_angle = 0.0;
      var last_angle = 0.0;

      var first_length = 0.0;
      var last_length = 0.0;


      var pi = 3.1415968;
      for( var n=0;n<envelope_details.results.length;n++ ){
        var _items = envelope_details.results[n];
        var _item0 = _items[0];
        var _item1 = _items[1];
        var _item2 = _items[2];
        var _item3 = _items[3];

        var orientation0 = Math.atan2( ( _item1[1]-_item0[1] ), ( _item1[0]-_item0[0] ) )  * 180.0/pi;
        var orientation1 = Math.atan2( ( _item3[1]-_item2[1] ), ( _item3[0]-_item2[0] ) )  * 180.0/pi;

        var length0 = Math.sqrt(  ( ( _item0[0]-_item1[0] ) * ( _item0[0]-_item1[0] ) ) +
                    + ( ( _item0[1]-_item1[1] ) * ( _item0[1]-_item1[1] ) ) );

        var length1 = Math.sqrt(  ( ( _item2[0]-_item3[0] ) * ( _item2[0]-_item3[0] ) ) +
                    + ( ( _item2[1]-_item3[1] ) * ( _item2[1]-_item3[1] ) ) );

        if( n==0 ){
          first_angle  = orientation0;
          first_length = length0;

        }else{
          var _d_angle = (last_angle-orientation0);
            _d_angle = ( _d_angle + 180.0 ) % 360.0 - 180.0;


          if( Math.abs(_d_angle) < 45  ){

            if( (last_angle - orientation0) > 180.0 ){
              orientation0 += 360.0;
            }else if( (orientation0 - last_angle) > 180.0 ){
              last_angle += 360.0;
            }

            var avg = ((last_angle*last_length)+(orientation0*length0)) / (last_length+length0);
            var avg_deg = ( (avg) + 360.0 ) % 360.0;

            var _x0 = Math.abs(Math.cos(avg/180.0*pi)*length0);
            var _y0 = Math.abs(Math.sin(avg/180.0*pi)*length0);

            var _x1 = Math.abs(Math.cos(avg/180.0*pi)*last_length);
            var _y1 = Math.abs(Math.sin(avg/180.0*pi)*last_length);

            if( avg_deg < 90.0 ){

            }else if( avg_deg < 180.0 ){
              _x0*=-1.0;

              _x1*=-1.0;
            }else if( avg_deg < 270.0 ){
              _x0*=-1.0;
              _y0*=-1.0;

              _x1*=-1.0;
              _y1*=-1.0;
            }else{
              _y0*=-1.0;
              _y1*=-1.0;
            }

            envelope_details.results[n][1][0] = envelope_details.results[n][0][0] + _x0;
            envelope_details.results[n][1][1] = envelope_details.results[n][0][1] + _y0;

            envelope_details.results[n-1][2][0] = envelope_details.results[n-1][3][0] - _x1;
            envelope_details.results[n-1][2][1] = envelope_details.results[n-1][3][1] - _y1;

            orientation0 = orientation0 % 360.0;
          }


          if( n == envelope_details.results.length-1 && _closed ){

            var _d_angle = (orientation1-first_angle);
              _d_angle = ( _d_angle + 180.0 ) % 360.0 - 180.0;


            if( Math.abs(_d_angle) < 45  ){

              if( (orientation1 - first_angle) > 180.0 ){
                first_angle += 360.0;
              }else if( (first_angle - orientation1) > 180.0 ){
                orientation1 += 360.0;
              }

              var avg = ((orientation1*length1)+(first_angle*first_length)) / (length1+first_length);
              var avg_deg = ( (avg) + 360.0 ) % 360.0;

              var _x0 = Math.abs(Math.cos(avg/180.0*pi)*first_length);
              var _y0 = Math.abs(Math.sin(avg/180.0*pi)*first_length);

              var _x1 = Math.abs(Math.cos(avg/180.0*pi)*length1);
              var _y1 = Math.abs(Math.sin(avg/180.0*pi)*length1);

              if( avg_deg < 90.0 ){

              }else if( avg_deg < 180.0 ){
                _x0*=-1.0;

                _x1*=-1.0;
              }else if( avg_deg < 270.0 ){
                _x0*=-1.0;
                _y0*=-1.0;

                _x1*=-1.0;
                _y1*=-1.0;
              }else{
                _y0*=-1.0;
                _y1*=-1.0;
              }

              envelope_details.results[0][1][0] = envelope_details.results[0][0][0] + _x0;
              envelope_details.results[0][1][1] = envelope_details.results[0][0][1] + _y0;

              envelope_details.results[n][2][0] = envelope_details.results[n][3][0] - _x1;
              envelope_details.results[n][2][1] = envelope_details.results[n][3][1] - _y1;

              orientation0 = orientation0 % 360.0;
            }
          }
        }

        last_length = length1;
        last_angle = orientation1;
      }



    }

    //They've been preoptimized.
    _optimizeHandles = false;
    envelope_details.results = EnvelopeCreator().getLocalDeformationChain( envelope_details.results );
  }

  var _lastCurve = false;

  var _initx = 0;
  var _inity = 0;
  var _scalex = 0.5;

  var _grp_x = node.coordX( path );
  var _grp_y = node.coordY( path )-50;


  var par = node.parentNode( path );
  var module_item = [];

  var _composite = false;
  var _connfrom  = false;
  var _connto    = path;

  var columnId = node.linkedColumn(path,"DRAWING.ELEMENT");
  var drawingName = column.getDrawingName( columnId, frame );

  var _newDrawingName = [];
  var _splitDrawingName = drawingName.split(".");
  for( var n=0;n<_splitDrawingName.length-1;n++ ){
    _newDrawingName.push( _splitDrawingName[n] );
  }
  drawingName = _newDrawingName.join(".");

  drawingNameID = drawingName.split("-");
  drawingNameID = drawingNameID[drawingNameID.length-1];


  var found_existing_transformationSwitch = this.recurseParentTransformationSwitch( path, frame );
  var search_path = path;

  if( found_existing_transformationSwitch ){
  search_path = found_existing_transformationSwitch;
  }

  var found_existing_deformation = this.recurseParentFindDeformationComp( search_path );
  if( found_existing_deformation ){

    _composite = true;
    // System.println( "USING EXISTING DEFORMATION\n" );
    _connto = found_existing_deformation;
    par = node.parentNode( found_existing_deformation );

    _connfrom = node.getGroupInputModule( par, "MPORTIN", 0, 0, 0 )

    _grp_x = node.coordX( _connto );
    _grp_y = node.coordY( _connto )-50;

  }else{
    //NO COMPOSITE, PERHAPS A DEFORMATION WITHOUT?
    var found_existing_deformation = this.recurseParentFindDeformation( search_path );
    if(found_existing_deformation){

      //SANDWICH THE EXISTING DEFORMATION BENEATH THIS ONE.

      var _newCompx = node.coordX( found_existing_deformation );
      var _newCompy = node.coordY( found_existing_deformation );

      _newComposite = node.add( node.parentNode(found_existing_deformation), 'DeformationComposite', "DeformationCompositeModule", _newCompx, _newCompy+100, 0);

    //_newSwitch    = node.add( node.parentNode(found_existing_deformation), 'DeformationSwitch', "DeformationSwitchModule", _newCompx, _newCompy+100 + 200, 0);
      // node.setTextAttr(_newComposite, "outputkinematicchainselector", 1, "CHILD_READ" );
      // node.setTextAttr(_newComposite, "outputselectedonly", 1, "true" );

      var _lnki = node.dstNodeInfo( found_existing_deformation, 0, 0 );
      if( !_lnki ){
        //Uhh?
        return;
      }

      node.unlink( _lnki.node, _lnki.port );
      node.link( found_existing_deformation, 0, _newComposite, 0, true, true );
      node.link( _newComposite, 0, _lnki.node, _lnki.port, false, false );
      //node.link( _newSwitch, 0, _lnki.node, _lnki.port, false, false );

      //RELINK ALL BENEATH IT.
      for ( var n=0;n<node.numberOfOutputLinks( found_existing_deformation, 0 );n++){
        var _lnki = node.dstNodeInfo( found_existing_deformation, 0, n );
        // System.println("RELINKING BENEATH");

        if(_lnki){
          if( _lnki.node == _newComposite ){
            continue;
          }

          node.unlink( _lnki.node, _lnki.port );
          node.link( _newComposite, 0, _lnki.node, _lnki.port, false, false );
        }

      }

      // THIS NEW COMPOSITE IS READY.
      _composite = true;
      // System.println( "USING CREATED DEFORMATION COMPOSITE\n" );
      _connto = _newComposite;
      par = node.parentNode( _newComposite );
      _connfrom = node.getGroupInputModule( par, "MPORTIN", 0, 0, 0 )

      _grp_x = node.coordX( _connto );
      _grp_y = node.coordY( _connto )-50;

    }
  }



  var _newDrawingName = [];
  var _splitDrawingName = drawingName.split("-");
  for( var n=0;n<_splitDrawingName.length-1;n++ ){
    _newDrawingName.push( _splitDrawingName[n] );
  }
  drawingName = _newDrawingName.join("-");
  drawingName = "Deformation-" + drawingName;

  var _fgrpname = drawingNameID;

  var _already_exists = par + "/" + _fgrpname;

  if( !_composite ){
    _already_exists = par + "/" + drawingName;
  }


  // if( node.getName( _already_exists ) ){
    // MessageBox.information( "Error: Deformation already exists." );
    // return;
  // }

  var _lastX = 0;
  var _lastY = 0;

  var _firstOrientation = 0;
  var _firstLength      = 0;
  var _firstCurve       = false;

  var _lastOrientation  = 0;
  var _lastLength       = 0;

  for( var n=0;n<envelope_details.results.length;n++ ){
    // System.println( "BUILDING SEGMENT: "+n );

    var _items = envelope_details.results[n];
    var _item0 = _items[0];
    var _item1 = _items[1];
    var _item2 = _items[2];
    var _item3 = _items[3];

    var _gitems = _path_global[n];
    var _gitem0 = _gitems[0];
    var _gitem1 = _gitems[1];
    var _gitem2 = _gitems[2];
    var _gitem3 = _gitems[3];

    if( n == 0 ){ //OffsetModule

      var _x = _initx+((_gitem0[0])/0.005)*_scalex;
      var _y = _inity+(-(_gitem0[1])/0.005)*_scalex;
      if( !_buildShaped ){
        _x = _initx+(0)*_scalex;
        _y = _inity+((n-1)*100)*_scalex;
      }

      _lastCurve = node.add( par, 'OFFSET', "OffsetModule", _x, _y, 0);
      module_item.push( _lastCurve );

      node.setTextAttr(_lastCurve, "restingoffset.x", 1, (_gitem0[0]) );
      node.setTextAttr(_lastCurve, "restingoffset.y", 1, (_gitem0[1]) );
      node.setTextAttr(_lastCurve, "offset.x", 1, (_gitem0[0]) );
      node.setTextAttr(_lastCurve, "offset.y", 1, (_gitem0[1]) );

      if( _globalTransform ){
        node.setTextAttr(_lastCurve, "localreferential", 1, "false" );
      }else{
        node.setTextAttr(_lastCurve, "localreferential", 1, "true" );
      }
    }

  if( _item3[1] == 0.0 && _item3[1] == 0.0 ){
    //IF THERE IS NO OFFSET FROM THE LAST POINT. SKIP IT.
    continue;
  }

    var _yoff = 0.0;
    if( _buildShaped && n == envelope_details.results.length-1 ){
      _yoff = 75.0*_scalex;
    }

    var _x = _initx+((_gitem3[0])/0.005)*_scalex;
    var _y = _inity+(-(_gitem3[1])/0.005)*_scalex;
    if( !_buildShaped ){
      _x = _initx+(0)*_scalex;
      _y = _inity+(n*100)*_scalex;
    }

    var curveNode = node.add( par, 'CURVE', "CurveModule", _x, _y + _yoff, 0);
    module_item.push( curveNode );

    node.link( _lastCurve, 0, curveNode, 0 );
    node.setTextAttr(curveNode, "restingoffset.x", 1, (_item3[0]) );
    node.setTextAttr(curveNode, "restingoffset.y", 1, (_item3[1]) );
    node.setTextAttr(curveNode, "offset.x", 1, (_item3[0]) );
    node.setTextAttr(curveNode, "offset.y", 1, (_item3[1]) );

    if( _globalTransform ){
      node.setTextAttr(curveNode, "localreferential", 1, "false" );
    }else{
      node.setTextAttr(_lastCurve, "localreferential", 1, "true" );
    }

    var length0 = Math.sqrt(  ( ( _item0[0]-_item1[0] ) * ( _item0[0]-_item1[0] ) ) +
                + ( ( _item0[1]-_item1[1] ) * ( _item0[1]-_item1[1] ) ) );

    var length1 = Math.sqrt(  ( ( _item2[0]-_item3[0] ) * ( _item2[0]-_item3[0] ) ) +
                + ( ( _item2[1]-_item3[1] ) * ( _item2[1]-_item3[1] ) ) );


    node.setTextAttr(curveNode, "restlength0", 1, length0 );
    node.setTextAttr(curveNode, "length0", 1, length0 );

    node.setTextAttr(curveNode, "restlength1", 1, length1 );
    node.setTextAttr(curveNode, "length1", 1, length1 );

    var pi = 3.1415968;

    var orientation0 = Math.atan2( ( _item1[1]-_item0[1] ), ( _item1[0]-_item0[0] ) ) * 180.0/pi;
    var orientation1 = Math.atan2( ( _item3[1]-_item2[1] ), ( _item3[0]-_item2[0] ) ) * 180.0/pi;

    node.setTextAttr(curveNode, "orientation0", 1, orientation0 );
    node.setTextAttr(curveNode, "restingorientation0", 1, orientation0 );

    node.setTextAttr(curveNode, "orientation1", 1, orientation1 );
    node.setTextAttr(curveNode, "restingorientation1", 1, orientation1 );

    if( _closed && n == envelope_details.results.length-1 ){
      node.setTextAttr(curveNode, "closepath", 1, "true" );

      if( _optimizeHandles && _firstCurve ){

        var _d_angle = (_firstOrientation-orientation1);
          _d_angle = ( _d_angle + 180.0 ) % 360.0 - 180.0;

        if( Math.abs(_d_angle) < 45  ){

          if( (_firstOrientation - orientation1) > 180.0 ){
            orientation1 += 360.0;
          }else if( (orientation1 - _firstOrientation) > 180.0 ){
            _firstOrientation += 360.0;
          }

          var avg = ((_firstOrientation*_firstLength)+(orientation1*length1)) / (_firstLength+length1);

          node.setTextAttr(curveNode, "orientation1", 1, avg );
          node.setTextAttr(curveNode, "restingorientation1", 1, avg );

          node.setTextAttr(_firstCurve, "orientation0", 1, avg );
          node.setTextAttr(_firstCurve, "restingorientation0", 1, avg );

        }

      }
    }

    if( n > 0 ){
      if( _optimizeHandles ){
        //OPTIMIZE LAST MODULE : _lastOrientation and orientation0

        var _d_angle = (_lastOrientation-orientation0);
          _d_angle = ( _d_angle + 180.0 ) % 360.0 - 180.0;

        if( Math.abs(_d_angle) < 45  ){

          if( (_lastOrientation - orientation0) > 180.0 ){
            orientation0 += 360.0;
          }else if( (orientation0 - _lastOrientation) > 180.0 ){
            last_angle += 360.0;
          }

          var avg = ((_lastOrientation*_lastLength)+(orientation0*length0)) / (_lastLength+length0);

          node.setTextAttr(_lastCurve, "orientation1", 1, avg );
          node.setTextAttr(_lastCurve, "restingorientation1", 1, avg );

          node.setTextAttr(curveNode, "orientation0", 1, avg );
          node.setTextAttr(curveNode, "restingorientation0", 1, avg );

          orientation0 = orientation0 % 360.0;
        }

      }
    }else if( n == 0 ){
      _firstOrientation = orientation0;
      _firstLength      = length0;
      _firstCurve       = curveNode;
    }

    _lastOrientation = orientation1;
    _lastLength      = length1;
    _lastX = _x;
    _lastY = _y;

    _lastCurve        = curveNode;
  }


  if( !_closed ){
  //ADD A SCALE MODULE IF ITS A LINE.

    // var _scaleNode = node.add( par, 'DeformationScale',  "DeformationScaleModule",  _lastX, _lastY + 200, 0);
    // node.link( _lastCurve, 0, _scaleNode, 0 );
    // _lastCurve = _scaleNode;

    // node.setTextAttr(_scaleNode, "leftspan", 1, envelope_details.results.length );
    // node.setTextAttr(_scaleNode, "rightspan", 1, envelope_details.results.length );
    // module_item.push( _scaleNode );
  }

  // var _switchNode = node.add( par, 'DeformationSwitch', "DeformationSwitchModule", _lastX, _lastY + 250, 0);
  // module_item.push( _switchNode );
  //node.link( _lastCurve, 0, _switchNode, 0 );

  var temp_linkIN  = node.add( par, 'TEMP', "PEG", 0, 0, 0);
  var temp_linkOUT = node.add( par, 'TEMP', "PEG", 0, 150, 0);


  //KEEP LINKS OUTSIDE.
  if( !_composite ){
  //COMPOSITE.
    //var _newComposite = node.add( node.parentNode(module_item[module_item.length-1]), 'DeformationComposite', "DeformationCompositeModule", _lastX, _lastY + 300, 0);
    //var _newSwitch    = node.add( node.parentNode(module_item[module_item.length-1]), 'DeformationSwitch', "DeformationSwitchModule", _lastX, _lastY + 350, 0);
    // node.setTextAttr(_newComposite, "outputkinematicchainselector", 1, "CHILD_READ" );
    // node.setTextAttr(_newComposite, "outputselectedonly", 1, "true" );

  //NO COMPOSITE
    node.link( module_item[module_item.length-1], 0, temp_linkOUT, 0 );

  //COMPOSITE.
    // node.link( module_item[module_item.length-1], 0, _newComposite, 0 );
    // node.link( _newComposite, 0, temp_linkOUT, 0 );

    node.link( temp_linkIN, 0, module_item[0], 0, false, false );

  // INTERNAL GROUPINGS.
    // var grp_id = node.createGroup( module_item.join(","), _fgrpname);
    // node.setCoord( grp_id, _lastX, _lastY );
    // module_item = [ grp_id, _newComposite ];

    _fgrpname = drawingName;
  }else{

    node.link( temp_linkIN, 0, module_item[0], 0 );
    node.link( module_item[module_item.length-1], 0, temp_linkOUT, 0 );
  }

  //SPECIAL CASE. IF THERE WAS A DEFORMATION SWITCH FOUND-- ITS POSSIBLE TO CLEAN IT UP AND NOW CREATE A NEW GROUP.

  var grp_full = node.createGroup( module_item.join(","), _fgrpname);
  node.setCoord( grp_full, _grp_x, _grp_y );

  if( !_composite ){
    //UNLINK THE ITEMS.
    if( node.srcNode( _connto, 0 ) ){
      var _lnki = node.srcNodeInfo( _connto, 0 );
      if ( _lnki ){
        node.unlink( _connto, 0 );
        node.link( _lnki.node, _lnki.port, temp_linkIN, 0 );
      }
    }
  }

  node.link( temp_linkOUT, 0, _connto, 0, false, _composite );
  if( _connfrom ){
    node.link( _connfrom, 0, temp_linkIN, 0, false, false );
  }

  node.deleteNode(temp_linkIN);
  node.deleteNode(temp_linkOUT);

  if( found_existing_transformationSwitch ){
  //CHECK TO SEE IF IT HAS A COMPOSITE AND IF IT IS ALONE.

  if( node.numberOfInputPorts( found_existing_transformationSwitch ) == 1 ){
    //IN THIS CASE, ITS REMOVABLE.
    var src = node.srcNode( found_existing_transformationSwitch, 0 );

    //DELETE THE UNNECESSARY COMPOSITE
    node.deleteNode( found_existing_transformationSwitch );

    //DELETE THE GROUP.
    var parent_to_clean = node.parentNode( src );
    node.explodeGroup(src);

    //FIND THE MIN/MAX Y OF ALL NODES -- SET THE MPORT IN AND OUT TO BE CLEANER
    var subnodes = node.subNodes( parent_to_clean );
    var y_min = 0;
    var y_max = 0;
    var mportin  = false;
    var mportout = false;
    for( var n=0;n<subnodes.length;n++ ){
      var ty = node.coordY( subnodes[n] );
      if( n==0||ty<y_min ){
        y_min = ty;
      }
      if( n==0||ty>y_max ){
        y_max= ty;
      }

      if(node.type( subnodes[n] ) == 'MULTIPORT_IN' ){
        mportin = subnodes[n];
      }else if(node.type( subnodes[n] ) == 'MULTIPORT_OUT' ){
        mportout = subnodes[n];
      }
    }

    if( mportin ){
      node.setCoord( mportin, node.coordX(mportin), y_min-50 );
    }
    if( mportout ){
      node.setCoord( mportout, node.coordX(mportout), y_max+50 );
    }
  }
  }

}

function EnvelopeCreator_showUI(){
  var ui_item = new private_EnvelopeCreator_ui();
  ui_item.ui.show();
}

function EnvelopeDrawer_showUI(){
  var ui_item = new private_EnvelopeDrawer_ui();
  ui_item.ui.show();
}

function EnvelopeCreator_act(){
  var ui_item = new private_EnvelopeCreator_ui();
  ui_item.createEnvelopes();
}

function EnvelopeCreator_actHint(){
  var ui_item = new private_EnvelopeCreator_ui();
  ui_item.createEnvelopesSource();
}

function EnvelopeDrawer_act(){
  var ui_item = new private_EnvelopeDrawer_ui();
  ui_item.createEnvelopes();
}
