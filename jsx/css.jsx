

    function testProgress() {
        app.doProgress(localize('$$$/Photoshop/Progress/CopyCSSProgress=Copying CSS...'), 'testProgressTask()');
    }

    function testProgressTask() {
        var i, total = 10;
        var progBar = new ProgressBar();
        progBar.totalProgressSteps = total;
        for (i = 0; i <= total; ++i) {
//		if (progBar.updateProgress( i ))
            if (progBar.nextProgress()) {
                $.writeln('cancelled');
                break;
            }
            $.sleep(800);
        }
    }

// Debug.  Uncomment one of these lines, and watch the output
// in the ESTK "JavaScript Console" panel.

// Walk the layers
//runCopyCSSFromScript = true; cssToClip.dumpLayers();

// Print out some interesting objects
//runCopyCSSFromScript = true; cssToClip.dumpLayerAttr( "AGMStrokeStyleInfo" );
//runCopyCSSFromScript = true; cssToClip.dumpLayerAttr( "adjustment" );  // Gradient, etc.
//runCopyCSSFromScript = true; cssToClip.dumpLayerAttr( "layerEffects" );  // Layer FX, drop shadow, etc.
//runCopyCSSFromScript = true; cssToClip.dumpLayerAttr( "textKey" );
//runCopyCSSFromScript = true; cssToClip.dumpLayerAttr( "bounds" );

// Some useful individual parameters
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr( "opacity" ) );
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr( "fillOpacity" ) );
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr( "name" ));
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr( "itemIndex" ));
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr( "layerFXVisible" ));
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr("layerSVGdata" ));
//runCopyCSSFromScript = true; $.writeln( cssToClip.dumpLayerAttr("layerVectorPointData" ));

// Debugging tests
//runCopyCSSFromScript = true; testProgress();
//runCopyCSSFromScript = true; cssToClip.countGroupLayers( cssToClip.getCurrentLayer() );

