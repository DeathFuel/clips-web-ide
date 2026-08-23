; Adapted from the CLIPS 6.4.2 Reference Manual, Vol. 1 Section 10.6

(defmodule MAIN (export deftemplate list))
(deftemplate list (slot name) (multislot numbers))

(deffacts initial
    (list (name A) (numbers 3 8 2 9 3 4 7))
    (list (name B) (numbers 1 6 3 9 5 8 0))
)

(defrule start
    =>
    (focus SORT PRINT)
)

(defmodule SORT (import MAIN deftemplate list))

(defrule sort
    ?f <- (list (numbers $?b ?x ?y&:(> ?x ?y) $?e))
    =>
    (modify ?f (numbers ?b ?y ?x ?e))
)

(defmodule PRINT (import MAIN deftemplate list))

(defrule print
    (list (name ?name) (numbers $?numbers))
    =>
    (println "Sorted list " ?name " is " (implode$ ?numbers))
)

(reset)
(run)
