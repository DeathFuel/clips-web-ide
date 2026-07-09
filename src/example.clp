(deffacts l (fib 8) (fib-seq 0 0) (fib-seq 1 1))

(defrule sum
    (fib-seq ?i ?x)
    (fib-seq ?j ?y)
    (fib ?n)
    (test (= ?j (+ ?i 1)))
    (test (< ?j ?n))
    =>
    (assert (fib-seq (+ ?j 1) (+ ?x ?y)))
)

(reset)
(run)
(facts)
