(deffunction collatz (?n)
    (if (= (mod ?n 2) 0) then
        (return (div ?n 2))
    else
        (return (+ (* ?n 3) 1))
    )
)

(defrule step
    ?f <- (number ?n)
    (test (> ?n 1))
    =>
    (bind ?m (collatz ?n))
    (print ?n " -> ")
    (retract ?f)
    (assert (number ?m))
)

(defrule print-one
    ?f <- (number ?n)
    (test (= ?n 1))
    =>
    (println "1")
)

(deffacts init (number 27))
(reset)
(run)
