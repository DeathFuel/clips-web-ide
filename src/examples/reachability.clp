(defclass POINT (is-a USER)))
(defclass ARC (is-a USER) (slot p1) (slot p2))

(definstances POINTS
    (A of POINT) (B of POINT) (C of POINT) (D of POINT) (E of POINT) (F of POINT)
)

(definstances ARCS
    "ABC and DEF are triangles linked by an arc that's been commented out!"
    (l1 of ARC (p1 A) (p2 B))
    (l2 of ARC (p1 B) (p2 C))
    (l3 of ARC (p1 C) (p2 A))
    (l4 of ARC (p1 D) (p2 E))
    (l5 of ARC (p1 E) (p2 F))
    (l6 of ARC (p1 F) (p2 D))
    ;(l7 of ARC (p1 A) (p2 D))
)

(defrule reachable-seed (declare (salience 1))
    (object (is-a ARC) (p1 ?a) (p2 ?b))
    =>
    (assert (connected ?a ?b))
)

(defrule reachable (declare (salience 1))
    (connected ?a ?b)
    (connected ?b ?c)
    (test (neq ?a ?c))
    =>
    (assert (connected ?a ?c))
)

(defrule check-goal
    (check-if-reachable ?start ?end)
    (connected ?start ?end)
    =>
    (println ?end " is reachable from " ?start ".")
)

(defrule check-not-goal
    (check-if-reachable ?start ?end)
    (not (connected ?start ?end))
    =>
    (println ?end " is not reachable from " ?start ".")
)

(deffacts goal
    (check-if-reachable A C)
    (check-if-reachable B F)
    (check-if-reachable F B)
)

(reset)
(run)

; Exercise: set the rule salience values to 0 and see what issue that causes.
; Identify its root cause with the help of the Agenda Viewer tab.
