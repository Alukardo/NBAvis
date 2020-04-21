// Narrative Charts
// ================
//
// `d3.layout.narrative()`
//
// The constructor takes no arguements. All relevant object properties should
// be set using the setter functions.

d3.layout.narrative = function () {

    let scenes, characters, introductions, links, groups, totalCharacters;
    let size = [1, 1];
    let scale = 1;
    let pathSpace = 10;
    let labelSize = [100, 15];
    let labelPosition = 'right';
    let scenePadding = [0, 0, 0, 0];
    let groupMargin = 0;
    let orientation = 'horizontal';
    let r2eSort = true;

// Public functions (the API)
// ==========================
// The narrative object which is returned and exposes the public API.
    let narrative = {};
    narrative.scenes = function (_) {
        if (!arguments.length) {
            return scenes;
        }
        scenes = _;
        return narrative;
    };
    narrative.characters = function (_) {
        if (!arguments.length) {
            return characters;
        }
        characters = _;
        return narrative;
    };
    narrative.size = function (_) {
        if (!arguments.length) {
            return size;
        }
        size = _;
        return narrative;
    };
    narrative.scale = function (_) {
        if (!arguments.length) {
            return scale;
        }
        scale = _;
        return narrative;
    };
    narrative.orientation = function (_) {
        if (!arguments.length) {
            return orientation;
        }
        orientation = _;
        return narrative;
    };
    narrative.extent = function () {
        return scenes.concat(introductions).reduce(function (max, d) {
            const bounds = d.bounds();
            if (bounds[1][1] > max[1]) {
                max[1] = bounds[1][1];
            }
            if (bounds[1][0] > max[0]) {
                max[0] = bounds[1][0];
            }
            return max;
        }, [0, 0]);
    };
    narrative.pathSpace = function (_) {
        if (!arguments.length) {
            return pathSpace;
        }
        pathSpace = _;
        return narrative;
    };
    narrative.groupMargin = function (_) {
        if (!arguments.length) {
            return groupMargin;
        }
        groupMargin = _;
        return narrative;
    };
    narrative.scenePadding = function (_) {
        if (!arguments.length) {
            return scenePadding;
        }
        scenePadding = _;
        return narrative;
    };
    narrative.labelSize = function (_) {
        if (!arguments.length) {
            return labelSize;
        }
        labelSize = _;
        return narrative;
    };
    narrative.labelPosition = function (_) {
        if (!arguments.length) {
            return labelPosition;
        }
        labelPosition = _;
        return narrative;
    };
    narrative.r2eSort = function (_) {
        if (!arguments.length) {
            return r2eSort;
        }
        r2eSort = _;
        return narrative;
    };
    narrative.links = function () {
        return links;
    };
    narrative.link = function () {
        let curvature = 0.9;

        // ### Link path
        //
        // `link([object])`
        //
        // This function should be used to set the `path` attribute of links when
        // displaying the narrative chart. It accepts an object and returns a path
        // string linking the two.
        function link(d) {
            let x0, y0, x1, y1, cx0, cy0, cx1, cy1, ci;

            // Set path end positions.
            x0 = (d.source.scene) ? d.source.scene.x + d.source.x : d.source.x;
            y0 = (d.source.scene) ? d.source.scene.y + d.source.y : d.source.y;
            x1 = (d.target.scene) ? d.target.scene.x + d.target.x : d.target.x;
            y1 = (d.target.scene) ? d.target.scene.y + d.target.y : d.target.y;

            let padding = 40;
            // Set control points.
            if (x1 - x0 <= padding) {
                if (orientation === 'vertical') {
                    ci = d3.interpolateNumber(y0, y1);
                    cx0 = x0;
                    cy0 = ci(curvature);
                    cx1 = x1;
                    cy1 = ci(1 - curvature);
                } else {
                    ci = d3.interpolateNumber(x0, x1);
                    cx0 = ci(curvature);
                    cy0 = y0;
                    cx1 = ci(1 - curvature);
                    cy1 = y1;
                }

                return "M" + x0 + "," + y0 +
                    "C" + cx0 + "," + cy0 +
                    " " + cx1 + "," + cy1 +
                    " " + x1 + "," + y1;
            } else {
                if (orientation === 'vertical') {
                    ci = d3.interpolateNumber(y0, y1);
                    cx0 = x0;
                    cy0 = ci(curvature);
                    cx1 = x1;
                    cy1 = ci(1 - curvature);
                } else {
                    ci = d3.interpolateNumber(x1 - padding, x1);
                    cx0 = ci(curvature);
                    cy0 = y0;
                    cx1 = ci(1 - curvature);
                    cy1 = y1;
                }

                return "M" + x0 + "," + y0 +
                    "L" + (x1 - padding) + "," + y0 +
                    "C" + cx0 + "," + cy0 +
                    " " + cx1 + "," + cy1 +
                    " " + x1 + "," + y1;
            }
        }

        // ### Curvature
        //
        // `link.curvature([number])`
        //
        // Set or get the curvature which should be used to generate links. Should be
        // in the range zero to one.
        link.curvature = function (_) {
            if (!arguments.length) {
                return curvature;
            }
            curvature = _;
            return link;
        };

        return link;
    };
    narrative.introductions = function () {
        return introductions;
    };
    narrative.layout = function () {
        computeSceneCharacters();
        computeCharacterGroups();
        setSceneGroups();
        computeGroupAppearances();
        sortGroups();
        computeGroupPositions();
        computeCharacterGroupPositions();
        sortGroupAppearances();
        computeSceneTiming();
        computeScenePositions();
        createIntroductionNodes();
        computeIntroductionPositions();
        createLinks();
        return narrative;
    };
    return narrative;

// Initial data wrangling
// ----------------------
//
// Populate the scenes with characters from the characters array.
// This method also cleanses the data to exclude characters which appear only once
// and scenes with fewer than two characters.
    function computeSceneCharacters() {

        let appearances, finished;

        // Create a map of scenes to characters (i.e. appearances).
        appearances = [];
        scenes.forEach(function (scene) {
            scene.characters.forEach(function (character) {
                if (character === undefined) return false;
                // If the character isn't an object assume it's an index from the characters array.
                character = (typeof character === 'object') ? character : characters[character];
                // Note forced character positions and sizes.
                character._x = character.x || false;
                character._y = character.y || false;
                character._width = character.width || false;
                character._height = character.height || false;
                let des = "";
                for (let i = 0; i < scene.description.length; i++) {
                    if (scene.description[i].id == character.id) {
                        des = scene.description[i].action;
                        break;
                    }
                }
                // Add this appearance to the map.
                appearances.push({id: character.id + "-" + scene.id, character: character, scene: scene, des: des});

                // Setup some properties on the character and scene that we'll need later.
                scene.appearances = [];
                scene.bounds = getSceneBounds;
                character.appearances = [];
            });

            // note forces scene positions.
            scene._x = scene.x || false;
            scene._y = scene.y || false;
        });

        // Recursively filter appearances so we ultimately only include characters
        // with more than a single appearance and scenes with more than a single
        // character.
        while (!finished) {
            finished = true;
            appearances = appearances.filter(filterAppearances);
        }

        // Filter appearances.
        //
        // TODO: this could probably be more efficient (maybe with an index https://gist.github.com/AshKyd/adc7fb024787bd543fc5)
        function filterAppearances(appearance) {
            let counts, keep;

            counts = appearances.reduce(function (c, a) {

                if (appearance.character === a.character) {
                    c[0]++;
                }

                if (appearance.scene === a.scene) {
                    c[1]++;
                }

                return c;

            }, [0, 0]);

            keep = counts[0] >= 1 && counts[1] >= 1;
            finished = finished && keep;

            return keep;
        }

        // Re-construct `characters` and `scenes` arrays with filtered appearances.
        totalCharacters = characters;
        characters = [];
        scenes = [];
        appearances.forEach(function (appearance) {

            // Cross reference scenes and characters based on appearances.
            appearance.scene.appearances.push(appearance);
            appearance.character.appearances.push(appearance);

            if (characters.indexOf(appearance.character) === -1) {
                characters.push(appearance.character);
            }

            if (scenes.indexOf(appearance.scene) === -1) {
                scenes.push(appearance.scene);
            }
        });
    }
// Character clustering
// --------------------
//
// Cluster characters based on their co-occurence in scenes
    function computeCharacterGroups() {
        let groupsMap, initGroups;
        groups = [];
        groupsMap = {};
        initGroups = totalCharacters.reduce(function (g, d, i) {
            if (d.initialGroup !== undefined) {
                g[i] = d.initialGroup;
            }
            return g;
        }, {});
        totalCharacters.forEach(function (character, i) {
            let groupId, group;
            groupId = initGroups[i];
            group = groupsMap[groupId];
            if (!group) {
                group = {id: groupId, characters: []};
                groups.push(group);
                groupsMap[groupId] = group;
            }
            group.characters.push(character);
            character.group = group;
        });
    }
// Group scenes
// ------------
//
// Each scene is assigned to a group based on the median character group for
// characters appearing in that scene.
// *Note:* "median" here is a mistake, it should be mode.
    function setSceneGroups() {
        scenes.forEach(function (scene) {
            let groupCounts, groupCountsMap, modeGroup;

            groupCounts = [];
            groupCountsMap = {};
            scene.appearances.forEach(function (appearance) {
                let count, index;

                index = groups.indexOf(appearance.character.group);
                count = groupCountsMap[index];

                if (!count) {
                    count = {groupIndex: index, count: 0};
                    groupCountsMap[index] = count;
                    groupCounts.push(count);
                }
                count.count++;
            });

            groupCounts.sort(function (a, b) {
                return a.count - b.count;
            });

            modeGroup = groups[groupCounts.shift().groupIndex]; // shift() groupId depends 1st player
            // While we're here record how many scenes this group is the modal group for.
            modeGroup.modeCount = modeGroup.modeCount || 0;
            modeGroup.modeCount++;
            scene.group = modeGroup;
        });
        scenesPartition(scenes);
    }
// Group appearances
// -----------------
//
// Assign unique set of characters to each group based on appearances in
// scenes belonging to that group.
    function computeGroupAppearances() {
        scenes.forEach(function (scene) {
            let characters;
            characters = scene.appearances.map(function (a) {
                return a.character;
            });
            scene.group.appearances = scene.group.appearances || [];
            scene.group.appearances = scene.group.appearances.concat(characters.filter(function (character) {
                return scene.group.appearances.indexOf(character) === -1;
            }));
        });
    }
// Sort groups
// -----------
//
// Sort the array of groups so groups which are most often the median are at
// the extremes of the array. The centre most group should be the group which
// is least often the median group of a scene.
    function sortGroups() {
        groups.sort(function (a, b) {
            return b.id - a.id;
        });
    }
// Group positions
// ---------------
//
// Compute the actual min and max y-positions of each group.
    function computeGroupPositions() {
        let max = 0;
        groups.forEach(function (group) {
            group.min = max;
            max = characterGroupHeight(group.characters.length) + group.min;
            group.max = max;
            max += groupMargin;
        });
    }
// Sort group appearances
// ----------------------
//
// Group appearances (`group.appearances`) is an array
// of all characters which appear in scenes assigned to this group.
    function sortGroupAppearances() {
        // let nodes  = characters.map(function (d, i) {
        //     return i;
        // });
        // let edges  = getEdges(characters, scenes);
        // let matrix = getMatrix(nodes, edges);
    }
// Character group positions
// -------------------------
//
// Compute the position of each character within its group.
    function computeCharacterGroupPositions() {

        let charactersOrder = SortR2e(totalCharacters, scenes);

        function SortR2e(characters, scenes) {
            let nodes = characters.map(function (d, i) {
                return i;
            });
            let edges = getEdges(characters, scenes);
            let edgeAMax = edges.reduce((edge1, edge2) => {
                return edge1.weight > edge2.weight ? edge1 : edge2
            }, []);
            let sceneMatrix = [];
            for (let i = 0; i < nodes.length; i++) {
                sceneMatrix[i] = [];
                for (let j = 0; j < nodes.length; j++) {
                    sceneMatrix[i][j] = 0.0;
                }
            }
            edges.forEach(function (d) {
                sceneMatrix[d.source][d.target] = d.weight.toFixed(1) / edgeAMax.weight * 10;
                sceneMatrix[d.target][d.source] = d.weight.toFixed(1) / edgeAMax.weight * 10;
            });
            for (let i = 0; i < nodes.length; i++) {
                for (let j = 0; j < nodes.length; j++) {
                    if (characters[i].group.id === characters[j].group.id) {
                        sceneMatrix[i][j] = sceneMatrix[i][j] + 0.9;
                    }
                }
            }
            return r2e(sceneMatrix, characters.length);
        }

        totalCharacters.forEach(function (d, i) {
            d.r2eIndex = charactersOrder[i];
        });
        groups.forEach(function (group) {
            if (r2eSort) {
                group.characters.sort(function (a, b) {
                    return a.r2eIndex - b.r2eIndex;
                });
            }

            group.characters.forEach(function (character, i) {
                character.cOrder = i;
            });
        });
    }
// Scene timing
// ------------
//
// Compute the scene timing.
//
// TODO: support dates
    function computeSceneTiming() {
        let duration = 1;
        scenes.forEach(function (scene) {
            scene.start = scene.start || duration;
            scene.duration = scene.duration || 1;
            duration += scene.duration;
        });

        //scale = ((orientation === 'vertical') ? size[1] - labelSize[1] : size[0] - labelSize[0]) / duration;

        scale = 1;
        console.log('scale:' + scale);
    }
// Position scenes
// ---------------
//
// Compute the actual x and y positions for each scene.
    function computeScenePositions() {

        let prePositions = {};

        let rate = 0.5;

        totalCharacters.forEach(function (d) {
            prePositions[d.id] = characterPosition(d.cOrder) + d.group.min
        });

        scenes.forEach(function (scene) {
            let sum = 0, avg, appearances;

            let tempAppearance = scene.appearances[0];

            // appearances 位置计算
            scene.appearances.sort(function (a, b) {
                return prePositions[a.character.id] - prePositions[b.character.id];
            });
            scene.appearances.forEach(function (appearance, i) {
                if (orientation === 'vertical') {
                    appearance.y = scenePadding[0];
                    appearance.x = rate * characterPosition(i) + scenePadding[3];
                    prePositions[appearance.character.id] = avg + appearance.x;
                } else {
                    appearance.y = rate * characterPosition(i) + scenePadding[0];
                    appearance.x = scenePadding[3];
                }
            });
            if (scene.appearances.length > 1) {
                scene.width = scenePadding[1] + scenePadding[3];
                scene.height = rate * characterGroupHeight(scene.appearances.length) + scenePadding[0] + scenePadding[2];
            } else {
                scene.width = 4;
                scene.height = 4;
            }
            if (scene.appearances.length > 1) {
                avg = characterPosition(tempAppearance.character.cOrder) + tempAppearance.character.group.min;
                //avg = prePositions[tempAppearance.character.id]
            } else if (scene.appearances.length == 1) {
                avg = characterPosition(tempAppearance.character.cOrder) + tempAppearance.character.group.min;
                // avg = prePositions[tempAppearance.character.id] ;
            }

            if (orientation === 'vertical') {
                scene.x = Math.max(0, avg - tempAppearance.x);
                scene.y = Math.max(labelSize[0], scale * scene.start + labelSize[1]);
            } else {
                scene.x = Math.max(labelSize[0], scale * scene.start + labelSize[0]);
                scene.y = Math.max(0, avg - tempAppearance.y);
            }

            scene.appearances.forEach(function (appearance) {
                if (orientation === 'vertical') {
                    prePositions[appearance.character.id] = scene.x + appearance.x;
                } else {
                    prePositions[appearance.character.id] = scene.y + appearance.y;
                }
            });
        });

    }
// Introduction nodes
// ------------------
//
// Create a collection of character 'introduction' nodes. These are nodes which
// are displayed before the first appearance of each character.
    function createIntroductionNodes() {
        let appearances;

        appearances = totalCharacters.map(function (character) {
            return character.appearances[0];
        });

        let appearanceMin = appearances.reduce((a, b) => {
            return a.scene.x < b.scene.x ? a : b
        }, appearances[0]);

        introductions = [];
        appearances.forEach(function (appearance) {

            let introduction, x, y;

            // Create the introduction object.
            introduction = {
                character: appearance.character,
                bounds: getLabelBounds
            };

            // Set the default position.
            if (orientation === 'vertical') {

                x = appearance.scene.x + appearance.x;
                y = appearanceMin.scene.y - 0.5 * scale;

                // Move x-axis position to the dedicated label space if it makes sense.
                if (x - labelSize[0] < labelSize[0]) {
                    x = labelSize[0];
                }
            } else {

                x = 0 - 0.5 * scale;
                y = characterPosition(appearance.character.cOrder) + appearance.character.group.min;
                //x = appearanceMin.scene.x - 0.5 * scale;
                //y = appearance.scene.y + appearance.y;

                // Move x-axis position to the dedicated label space if it makes sense.
                if (x - labelSize[0] < labelSize[0]) {
                    x = labelSize[0];
                }
            }

            if (orientation === 'vertical') {
                introduction.x = appearance.character._x || Math.max(0 + labelSize[0] / 2, x);
                introduction.y = appearance.character._y || Math.max(labelSize[0], y);
            } else {
                introduction.x = appearance.character._x || Math.max(labelSize[0], x);
                introduction.y = appearance.character._y || Math.max(0 + labelSize[1] / 2, y);
            }

            introduction.width = appearance.character._width || labelSize[0];
            introduction.height = appearance.character._height || labelSize[1];

            appearance.character.introduction = introduction;
            introductions.push(introduction);

        });
    }
// Introduction positions
// ----------------------
//
// Layout the introduction nodes so that wherever possible they don't overlap
// scenes or each other.
    function computeIntroductionPositions() {

        let collidables, intros;

        // Get a list of things introductions can collide with.
        //collidables = introductions.concat(scenes);
        let tempScenes = [];
        scenes.forEach(function (d) {
            if (d.characters.length > 1) {
                tempScenes.push(d);
            }
        });
        collidables = introductions.concat(tempScenes);
        // Use a copy of the introductions array so we can sort it without changing
        // the main array's order.
        intros = introductions.slice();

        // Sort by y-axis position top to bottom.
        intros.sort(function (a, b) {
            return a.y - b.y;
        });

        // Attempt to resolve collisions.
        collidables.forEach((orientation === 'vertical') ? resolveCollisionsVertical : resolveCollisionsHorizontal);

        // Resolve collisions with horizontal layout.
        function resolveCollisionsHorizontal(introduction) {

            let moveOptions, collisionBounds, introBounds, move, _y, collisions, movable;

            // Get the full list of items this introduction collides with
            collisions = collidesWith(introduction);

            // No need to continue if there are no collisions.
            if (!collisions) {
                return;
            }

            // Move colliding items out of the way if possible.
            movable = collisions.filter(function (collision) {
                return (collision.character);
            });
            movable.forEach(moveCollision);

            // Now only consider immovables (i.e. scene nodes).
            collisions = collisions.filter(function (collision) {
                return !(collision.character);
            });

            // No need to continue if there are no collisions.
            if (!collisions) {
                return;
            }

            // Get a bounding box for all remaining colliding nodes.
            collisionBounds = bBox(collisions);
            introBounds = introduction.bounds();

            // Record the original y-axis position so we can revert if a move is a failure.
            _y = introduction.y;

            // Calculate the two move options (up or down).
            moveOptions = [collisionBounds[1][1] - introBounds[0][1], collisionBounds[0][1] - introBounds[1][1]];

            // Sort by absolute distance. Try the smallest move first.
            moveOptions.sort(function (a, b) {
                return Math.abs(a) - Math.abs(b);
            });

            // Try the move options in turn.
            while (move = moveOptions.shift()) {

                introduction.y += move;
                collisions = collidesWith(introduction);

                if (collisions) {
                    if (move > 0 && collisions.every(isMovable)) {
                        collisions.forEach(moveCollision);
                        break;
                    } else {
                        introduction.y = _y;
                    }
                } else {
                    break;
                }
            }

            // Move the colliding nodes.
            function moveCollision(collision) {
                collision.y += introduction.bounds()[1][1] - collision.bounds()[0][1];
            }
        }

        // Resolve collisions with vertical layout.
        function resolveCollisionsVertical(introduction) {

            let moveOptions, collisionBounds, introBounds, move, _y, collisions, movable;

            // Get the full list of items this introduction collides with
            collisions = collidesWith(introduction);

            // No need to continue if there are no collisions.
            if (!collisions) {
                return;
            }

            // Move colliding items out of the way if possible.
            movable = collisions.filter(function (collision) {
                return (collision.character);
            });
            movable.forEach(moveCollision);

            // Now only consider immovables (i.e. scene nodes).
            collisions = collisions.filter(function (collision) {
                return !(collision.character);
            });

            // No need to continue if there are no collisions.
            if (!collisions) {
                return;
            }

            // Get a bounding box for all remaining colliding nodes.
            collisionBounds = bBox(collisions);
            introBounds = introduction.bounds();

            // Record the original y-axis position so we can revert if a move is a failure.
            _y = introduction.y;

            // Calculate the two move options (up or down).
            moveOptions = [collisionBounds[1][1] - introBounds[0][1], collisionBounds[0][1] - introBounds[1][1]];

            // Sort by absolute distance. Try the smallest move first.
            moveOptions.sort(function (a, b) {
                return Math.abs(a) - Math.abs(b);
            });

            // Try the move options in turn.
            while (move = moveOptions.shift()) {

                introduction.y += move;
                collisions = collidesWith(introduction);

                if (collisions) {
                    if (move > 0 && collisions.every(isMovable)) {
                        collisions.forEach(moveCollision);
                        break;
                    } else {
                        introduction.y = _y;
                    }
                } else {
                    break;
                }
            }

            // Move the colliding nodes.
            function moveCollision(collision) {
                collision.y += introduction.bounds()[1][1] - collision.bounds()[0][1];
            }
        }

        // Is the supplied node movable?
        function isMovable(collision) {
            return (collision.character);
        }

        // Create a bounding box around a collection of nodes.
        function bBox(arr) {
            let x0, x1, y0, y1;
            x0 = d3.min(arr, function (d) {
                return d.bounds()[0][0];
            });
            x1 = d3.max(arr, function (d) {
                return d.bounds()[1][0];
            });
            y0 = d3.min(arr, function (d) {
                return d.bounds()[0][1];
            });
            y1 = d3.max(arr, function (d) {
                return d.bounds()[1][1];
            });
            return [[x0, y0], [x1, y1]];
        }

        // Gets a list of all other nodes that this introduction collides with.
        function collidesWith(introduction) {
            let i, ii, collisions;
            collisions = [];
            for (i = 0, ii = collidables.length; i < ii; i++) {
                if (introduction !== collidables[i] && collides(introduction.bounds(), collidables[i].bounds())) {
                    collisions.push(collidables[i]);
                }
            }
            return (collisions.length) ? collisions : false;
        }

        // Check for overlap between two bounding boxes.
        function collides(a, b) {
            return !(
                // Verticals.
                a[1][0] <= b[0][0] ||
                b[1][0] <= a[0][0] ||

                // Horizontals.
                a[1][1] <= b[0][1] ||
                b[1][1] <= a[0][1]);
        }

    }
// Links
// -----
//
// Create a collection of links between appearances.
    function createLinks() {
        links = [];

        characters.forEach(function (character) {
            let i;
            let linkGroup = {id: character.id, links: []};

            // Links to intro nodes.
            linkGroup.links.push({
                character: character,
                source: character.introduction,
                target: character.appearances[0]
            });

            // Standard appearance links.
            for (i = 1; i < character.appearances.length; i++) {
                linkGroup.links.push({
                    character: character,
                    source: character.appearances[i - 1],
                    target: character.appearances[i]
                });
            }
            links.push(linkGroup);
        });
    }
// Utility functions
// =================
//
// Get the actual y-axis position of a character with the given (zero based) index.
    function characterPosition(index) {
        return index * pathSpace + pathSpace / 2;
    }
// Get the actual height of a group based on a character count.
    function characterGroupHeight(count) {
        return count * pathSpace;
    }
// Scene bounds
// ------------
//
// This is attached to all scene objects as `scene.bound` and returns the bounds
// for the scene node.
    function getSceneBounds() {
        return [[this.x, this.y], [this.x + this.width, this.y + this.height]];
    }
// Label bounds
// ------------
//
// This is attached to all character objects as `character.bounds` and returns
// the bounds of the character's introduction label.
    function getLabelBounds() {
        switch (labelPosition) {
            case('left'):
                return [[this.x - this.width, this.y - this.height / 2], [this.x, this.y + this.height / 2]];
            case('above'):
                return [[this.x - this.width / 2, this.y - this.height], [this.x + this.width / 2, this.y]];
            case('right'):
                return [[this.x, this.y - this.height / 2], [this.x + this.width, this.y + this.height / 2]];
            case('below'):
                return [[this.x - this.width / 2, this.y], [this.x + this.width / 2, this.y + this.height]];
        }

    }
//椭圆排序
    function r2e(sceneMatrix, row_number) {

        //2D array to 1D array
        let len = row_number * row_number;
        let inputRowProx = new Float64Array(len);
        for (let i = 0; i < row_number; i++) {
            for (let j = 0; j < row_number; j++) {
                inputRowProx[i * row_number + j] = sceneMatrix[i][j];
            }
        }
        let bytes_per_element = inputRowProx.BYTES_PER_ELEMENT;   // 8 bytes each element
        //console.log("bytes_per_element:" + inputRowProx.BYTES_PER_ELEMENT);
        let start = 0;
        let end = 0;
        start = new Date().getTime();
        // 要測試的 function 開始 =======
        // alloc memory
        let input_ptr = Module._malloc(len * bytes_per_element);
        let output_ptr = Module._malloc(row_number * 4);

        Module.HEAPF64.set(inputRowProx, input_ptr / bytes_per_element); // write WASM memory calling the set method of the Float64Array

        Module.ccall(
            "ellipse_sort", //c++ function name
            null,   //output type
            ["number", "number", "number", "number", "number"], //input type
            [input_ptr, output_ptr, row_number, row_number, 0]       //input value
        );

        let output_array = new Int32Array(Module.HEAP32.buffer, output_ptr, row_number); // extract data to another JS array

        // 要測試的 function 結束 =======
        end = new Date().getTime();
        // 計算花多久時間
        //console.log((end - start) / 1000 + "sec");

        let result = output_array;

        Module._free(input_ptr.byteOffset);
        Module._free(output_ptr.byteOffset);
        return result;
    }
//获取edge
    function getEdges(characters, scenes) {
        let edges = [];
        scenes.forEach(function (scene) {
            edges = edges.concat(sceneEdges(scene.appearances, characters));
        });

        function sceneEdges(appearances, characters) {
            let i, j, matrix;
            matrix = [];
            if (appearances.length < 2) return matrix;
            for (i = appearances.length; i--;) {
                for (j = i; j--;) {
                    let a = characters.indexOf(appearances[i].character);
                    let b = characters.indexOf(appearances[j].character);
                    if (a !== -1 && b !== -1 && a !== b) matrix.push([a, b]);
                }
            }
            return matrix;
        }

        edges = edges.reduce(function (result, edge) {
            let resultEdge;
            resultEdge = result.filter(function (resultEdge) {
                edge.sort(function (a, b) {
                    return a - b;
                });
                return resultEdge.source === edge[0] && resultEdge.target === edge[1];
            })[0] || {source: edge[0], target: edge[1], weight: 0};
            resultEdge.weight++;
            if (resultEdge.weight === 1) {
                result.push(resultEdge);
            }
            return result;
        }, []);
        return edges;
    }
    function getMatrix(nodes, edges) {
        let sceneMatrix = [];
        for (let i = 0; i < nodes.length; i++) {
            sceneMatrix[i] = [];
            for (let j = 0; j < nodes.length; j++) {
                sceneMatrix[i][j] = 0.0;
            }
        }
        edges.forEach(function (d) {
            sceneMatrix[d.source][d.target] = d.weight;
            sceneMatrix[d.target][d.source] = d.weight;
        });
        return sceneMatrix
    }
    function findMax(matrix) {
        let id = 0;
        let value = 0;
        for (let i = 0; i < matrix.length; i++) {
            let tempValue = 0;
            for (let j = 0; j < matrix[i].length; j++) {
                tempValue += matrix[i][j];
            }
            if (tempValue > value) {
                id = i;
                value = tempValue;
            }
        }


    }
    function scenesPartition(scenes) {
        let Partitions = {home: [], away: [], cross: []};
        for (let i = 0; i < scenes.length; i++) {
            if (scenes[i].characters.length < 2) continue;
            if (scenes[i].characters[0]) ;
        }
    }
    function edgePartition(characters, scenes) {
        let nodes = characters.map(function (d, i) {
            return i;
        });
        let initGroups = characters.reduce(function (g, d, i) {
            if (d.initialgroup !== undefined) {
                g[i] = +d.initialgroup;
            }
            return g;
        }, {});
        let edges = [];
        scenes.forEach(function (scene) {
            edges = edges.concat(sceneEdges(scene.appearances));
        });
        edges = edges.reduce(function (result, edge) {
            var resultEdge;

            resultEdge = result.filter(function (resultEdge) {
                return (resultEdge.target === edge[0] || resultEdge.target === edge[1]) &&
                    (resultEdge.source === edge[0] || resultEdge.source === edge[1]);

            })[0] || {source: edge[0], target: edge[1], weight: 0};

            resultEdge.weight++;

            if (resultEdge.weight === 1) {
                result.push(resultEdge);
            }

            return result;
        }, []);
        let partitioner = jLouvain().nodes(nodes).edges(edges);

        if (initGroups) {
            partitioner.partition_init(initGroups);
        }

        let clusters = partitioner();

        function sceneEdges(list) {
            var i, j, matrix;
            matrix = [];
            for (i = list.length; i--;) {
                for (j = i; j--;) {
                    matrix.push([characters.indexOf(list[i].character), characters.indexOf(list[j].character)]);
                }
            }
            return matrix;
        }

        function jLouvain() {

            // Constants
            const __PASS_MAX = -1;
            const __MIN = 0.0000001;

            // Local vars
            let original_graph_nodes;
            let original_graph_edges;
            let original_graph = {};
            let partition_init;

            // Helpers
            function make_set(array) {
                const set = {};
                array.forEach(function (d) {
                    set[d] = true;
                });
                return Object.keys(set);
            }

            function obj_values(obj) {
                const vals = [];
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        vals.push(obj[key]);
                    }
                }
                return vals;
            }

            function get_degree_for_node(graph, node) {
                const neighbours = graph._assoc_mat[node] ? Object.keys(graph._assoc_mat[node]) : [];
                let weight = 0;
                neighbours.forEach(function (neighbour) {
                    let value = graph._assoc_mat[node][neighbour] || 1;
                    if (node === neighbour) {
                        value *= 2;
                    }
                    weight += value;
                });
                return weight;
            }

            function get_neighbours_of_node(graph, node) {
                if (typeof graph._assoc_mat[node] === 'undefined') {
                    return [];
                }

                const neighbours = Object.keys(graph._assoc_mat[node]);
                return neighbours;
            }


            function get_edge_weight(graph, node1, node2) {
                return graph._assoc_mat[node1] ? graph._assoc_mat[node1][node2] : undefined;
            }

            function get_graph_size(graph) {
                let size = 0;
                graph.edges.forEach(function (edge) {
                    size += edge.weight;
                });
                return size;
            }

            function add_edge_to_graph(graph, edge) {
                update_assoc_mat(graph, edge);

                const edge_index = graph.edges.map(function (d) {
                    return d.source + '_' + d.target;
                }).indexOf(edge.source + '_' + edge.target);

                if (edge_index !== -1) {
                    graph.edges[edge_index].weight = edge.weight;
                } else {
                    graph.edges.push(edge);
                }
            }

            function make_assoc_mat(edge_list) {
                const mat = {};
                edge_list.forEach(function (edge) {
                    mat[edge.source] = mat[edge.source] || {};
                    mat[edge.source][edge.target] = edge.weight;
                    mat[edge.target] = mat[edge.target] || {};
                    mat[edge.target][edge.source] = edge.weight;
                });

                return mat;
            }

            function update_assoc_mat(graph, edge) {
                graph._assoc_mat[edge.source] = graph._assoc_mat[edge.source] || {};
                graph._assoc_mat[edge.source][edge.target] = edge.weight;
                graph._assoc_mat[edge.target] = graph._assoc_mat[edge.target] || {};
                graph._assoc_mat[edge.target][edge.source] = edge.weight;
            }

            function clone(obj) {
                if (obj === null || typeof (obj) !== 'object') {
                    return obj;
                }

                const temp = obj.constructor();

                for (let key in obj) {
                    temp[key] = clone(obj[key]);
                }
                return temp;
            }

            //Core-Algorithm Related
            function init_status(graph, status, part) {
                status['nodes_to_com'] = {};
                status['total_weight'] = 0;
                status['internals'] = {};
                status['degrees'] = {};
                status['gdegrees'] = {};
                status['loops'] = {};
                status['total_weight'] = get_graph_size(graph);

                if (typeof part === 'undefined') {
                    graph.nodes.forEach(function (node, i) {
                        status.nodes_to_com[node] = i;
                        const deg = get_degree_for_node(graph, node);
                        if (deg < 0) {
                            throw 'Bad graph type, use positive weights!';
                        }
                        status.degrees[i] = deg;
                        status.gdegrees[node] = deg;
                        status.loops[node] = get_edge_weight(graph, node, node) || 0;
                        status.internals[i] = status.loops[node];
                    });
                } else {
                    graph.nodes.forEach(function (node) {
                        const com = part[node];
                        status.nodes_to_com[node] = com;
                        const deg = get_degree_for_node(graph, node);
                        status.degrees[com] = (status.degrees[com] || 0) + deg;
                        status.gdegrees[node] = deg;
                        let inc = 0.0;

                        const neighbours = get_neighbours_of_node(graph, node);
                        neighbours.forEach(function (neighbour) {
                            const weight = graph._assoc_mat[node][neighbour];
                            if (weight <= 0) {
                                throw "Bad graph type, use positive weights";
                            }

                            if (part[neighbour] === com) {
                                if (neighbour === node) {
                                    inc += weight;
                                } else {
                                    inc += weight / 2.0;
                                }
                            }
                        });
                        status.internals[com] = (status.internals[com] || 0) + inc;
                    });
                }
            }

            function __modularity(status) {
                const links = status.total_weight;
                let result = 0.0;
                const communities = make_set(obj_values(status.nodes_to_com));

                communities.forEach(function (com) {
                    const in_degree = status.internals[com] || 0;
                    const degree = status.degrees[com] || 0;
                    if (links > 0) {
                        result = result + in_degree / links - Math.pow((degree / (2.0 * links)), 2);
                    }
                });
                return result;
            }

            function __neighcom(node, graph, status) {
                // compute the communities in the neighb. of the node, with the graph given by
                // node_to_com

                const weights = {};
                const neighboorhood = get_neighbours_of_node(graph, node);//make iterable;

                neighboorhood.forEach(function (neighbour) {
                    if (neighbour !== node) {
                        const weight = graph._assoc_mat[node][neighbour] || 1;
                        const neighbourcom = status.nodes_to_com[neighbour];
                        weights[neighbourcom] = (weights[neighbourcom] || 0) + weight;
                    }
                });

                return weights;
            }

            function __insert(node, com, weight, status) {
                //insert node into com and modify status
                status.nodes_to_com[node] = +com;
                status.degrees[com] = (status.degrees[com] || 0) + (status.gdegrees[node] || 0);
                status.internals[com] = (status.internals[com] || 0) + weight + (status.loops[node] || 0);
            }

            function __remove(node, com, weight, status) {
                //remove node from com and modify status
                status.degrees[com] = ((status.degrees[com] || 0) - (status.gdegrees[node] || 0));
                status.internals[com] = ((status.internals[com] || 0) - weight - (status.loops[node] || 0));
                status.nodes_to_com[node] = -1;
            }

            function __renumber(dict) {
                let count = 0;
                const ret = clone(dict); //deep copy :)
                const new_values = {};
                const dict_keys = Object.keys(dict);
                dict_keys.forEach(function (key) {
                    const value = dict[key];
                    let new_value = (typeof new_values[value] === 'undefined') ? -1 : new_values[value];
                    if (new_value === -1) {
                        new_values[value] = count;
                        new_value = count;
                        count = count + 1;
                    }
                    ret[key] = new_value;
                });
                return ret;
            }

            function __one_level(graph, status) {
                //Compute one level of the Communities Dendogram.
                let modif = true,
                    nb_pass_done = 0,
                    cur_mod = __modularity(status),
                    new_mod = cur_mod;

                while (modif && nb_pass_done !== __PASS_MAX) {
                    cur_mod = new_mod;
                    modif = false;
                    nb_pass_done += 1;

                    graph.nodes.forEach(eachNode);
                    new_mod = __modularity(status);
                    if (new_mod - cur_mod < __MIN) {
                        break;
                    }
                }

                function eachNode(node) {
                    const com_node = status.nodes_to_com[node];
                    const degc_totw = (status.gdegrees[node] || 0) / (status.total_weight * 2.0);
                    const neigh_communities = __neighcom(node, graph, status);
                    __remove(node, com_node, (neigh_communities[com_node] || 0.0), status);
                    let best_com = com_node;
                    let best_increase = 0;
                    const neigh_communities_entries = Object.keys(neigh_communities);//make iterable;

                    neigh_communities_entries.forEach(function (com) {
                        const incr = neigh_communities[com] - (status.degrees[com] || 0.0) * degc_totw;
                        if (incr > best_increase) {
                            best_increase = incr;
                            best_com = com;
                        }
                    });

                    __insert(node, best_com, neigh_communities[best_com] || 0, status);

                    if (best_com !== com_node) {
                        modif = true;
                    }
                }
            }

            function induced_graph(partition, graph) {
                const ret = {nodes: [], edges: [], _assoc_mat: {}};
                let w_prec, weight;
                //add nodes from partition values
                const partition_values = obj_values(partition);
                ret.nodes = ret.nodes.concat(make_set(partition_values)); //make set
                graph.edges.forEach(function (edge) {
                    weight = edge.weight || 1;
                    const com1 = partition[edge.source];
                    const com2 = partition[edge.target];
                    w_prec = (get_edge_weight(ret, com1, com2) || 0);
                    const new_weight = (w_prec + weight);
                    add_edge_to_graph(ret, {'source': com1, 'target': com2, 'weight': new_weight});
                });
                return ret;
            }

            function partition_at_level(dendogram, level) {
                const partition = clone(dendogram[0]);
                for (var i = 1; i < level + 1; i++) {
                    Object.keys(partition).forEach(eachKey);
                }
                return partition;

                function eachKey(key) {
                    const node = key;
                    const com = partition[key];
                    partition[node] = dendogram[i][com];
                }
            }


            function generate_dendogram(graph, part_init) {

                if (graph.edges.length === 0) {
                    const part = {};
                    graph.nodes.forEach(function (node) {
                        part[node] = node;
                    });
                    return part;
                }
                const status = {};

                init_status(original_graph, status, part_init);
                let mod = __modularity(status);
                const status_list = [];
                __one_level(original_graph, status);
                let new_mod = __modularity(status);
                let partition = __renumber(status.nodes_to_com);
                status_list.push(partition);
                mod = new_mod;
                let current_graph = induced_graph(partition, original_graph);
                init_status(current_graph, status);

                while (true) {
                    __one_level(current_graph, status);
                    new_mod = __modularity(status);
                    if (new_mod - mod < __MIN) {
                        break;
                    }

                    partition = __renumber(status.nodes_to_com);
                    status_list.push(partition);

                    mod = new_mod;
                    current_graph = induced_graph(partition, current_graph);
                    init_status(current_graph, status);
                }

                return status_list;
            }

            const core = function () {
                const dendogram = generate_dendogram(original_graph, partition_init);
                return partition_at_level(dendogram, dendogram.length - 1);
            };

            core.nodes = function (nds) {
                if (arguments.length > 0) {
                    original_graph_nodes = nds;
                }
                return core;
            };

            core.edges = function (edgs) {
                if (typeof original_graph_nodes === 'undefined') {
                    throw 'Please provide the graph nodes first!';
                }

                if (arguments.length > 0) {
                    original_graph_edges = edgs;
                    const assoc_mat = make_assoc_mat(edgs);
                    original_graph = {
                        'nodes': original_graph_nodes,
                        'edges': original_graph_edges,
                        '_assoc_mat': assoc_mat
                    };
                }
                return core;
            };

            core.partition_init = function (prttn) {
                if (arguments.length > 0) {
                    partition_init = prttn;
                }
                return core;
            };

            return core;
        }
    }
};
