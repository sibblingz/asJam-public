1. Copy spaceport's client directory to this directory.
2. Build spaceport class member definitions:

    node $asJam/bin/export.js client/proxyclass.js > sp.defs

3. Convert project using definitions:

    node $asJam/bin/asJam.js --defs sp.defs src/ .

4. Copy `src/main.swf` to this directory:

    cp src/main.swf .

5. Modify `Main.js`:
   a. Call superconstructor in `Main`'s constructor:

        sp.MovieClip.call(this);

   b. Wrap function body in an `ADDED_TO_STAGE` handler:

        var self = this;
        self.addEventListener(sp.Event.ADDED_TO_STAGE, function(event) {
            // body, with 'this' written as 'self'

            event.target.removeEventListener(event.type, arguments.callee);
        });

6. Run local web server with this directory as root.
7. Go to `http://server/index.html?platform=flash`.
8. Observe demo.
