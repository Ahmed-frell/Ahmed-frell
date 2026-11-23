// Cubic Blur Text Effect for After Effects (no plugins needed).
// Select one or more layers (usually text layers) in the active comp, then
// File > Scripts > Run Script File... and pick this file.
// Per layer: Overlay blend, cubic fade-in at the in-point, Gaussian blur + fade-out at the out-point.

(function cubicBlurText() {
    var IN_FRAMES = 8, OUT_FRAMES = 10, BLUR_AT_1080 = 35;

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Open a composition and select layers first."); return; }
    var layers = comp.selectedLayers;
    if (layers.length === 0) { alert("Select the caption layers first."); return; }

    var fd = comp.frameDuration;
    var blurMax = BLUR_AT_1080 * comp.width / 1080;

    app.beginUndoGroup("Cubic Blur Text");
    for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        var tIn = L.inPoint, tOut = L.outPoint;
        var inEnd = tIn + IN_FRAMES * fd;
        var outStart = Math.max(inEnd, tOut - OUT_FRAMES * fd);

        L.blendingMode = BlendingMode.OVERLAY;

        // Opacity: cubic ease-out in, ease-in out
        var op = L.property("ADBE Transform Group").property("ADBE Opacity");
        while (op.numKeys > 0) op.removeKey(1);
        op.setValueAtTime(tIn, 0);
        op.setValueAtTime(inEnd, 100);
        op.setValueAtTime(outStart, 100);
        op.setValueAtTime(tOut, 0);
        var lin = new KeyframeEase(0, 15), easeOut = new KeyframeEase(0, 85);
        op.setTemporalEaseAtKey(1, [lin], [easeOut]);       // fast start
        op.setTemporalEaseAtKey(2, [new KeyframeEase(0, 85)], [lin]); // long settle = cubic out
        op.setTemporalEaseAtKey(3, [lin], [new KeyframeEase(0, 70)]); // slow start of fade = ease in
        op.setTemporalEaseAtKey(4, [new KeyframeEase(0, 15)], [lin]);

        // Gaussian Blur on the way out
        var fx = L.property("ADBE Effect Parade");
        var gb = null;
        for (var e = 1; e <= fx.numProperties; e++) {
            if (fx.property(e).matchName === "ADBE Gaussian Blur 2") { gb = fx.property(e); break; }
        }
        if (!gb) gb = fx.addProperty("ADBE Gaussian Blur 2");
        gb.name = "Cubic Blur Out";
        var bl = gb.property(1); // Blurriness
        try { gb.property(3).setValue(0); } catch (err) {} // Repeat Edge Pixels off
        while (bl.numKeys > 0) bl.removeKey(1);
        bl.setValueAtTime(outStart, 0);
        bl.setValueAtTime(tOut, blurMax);
        bl.setTemporalEaseAtKey(1, [lin], [new KeyframeEase(0, 15)]);   // blur builds quickly
        bl.setTemporalEaseAtKey(2, [new KeyframeEase(0, 70)], [lin]);
    }
    app.endUndoGroup();
})();
