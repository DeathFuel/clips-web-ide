(deffunction binary (?x)
    (if (or (eq ?x 0) (eq ?x 1)) then
        (return TRUE)
    else
        (println "Logic gate got an input of "?x"!")
        (halt)
    )
)

(defrule and-gate                           ; Here's a rule that represents a logic gate.
    (and-gate ?out ?a ?b)                   ; We've asserted that one exists, this one has an output and two inputs.
    (value ?a ?x) (value ?b ?y)             ; Its inputs have values.
    (test (binary ?x)) (test (binary ?y))   ; These values are numbers, either 0 or 1.
    =>                                      ; Given these conditions...
    (assert (value ?out (* ?x ?y)))         ; Its output terminal is assigned a value.
)

(defrule or-gate
    (or-gate ?out ?a ?b)
    (value ?a ?x) (value ?b ?y)
    (test (binary ?x)) (test (binary ?y))
    =>
    (assert (value ?out (max ?x ?y)))
)

(defrule not-gate
    (not-gate ?out ?a)
    (value ?a ?x)
    (test (binary ?x))
    =>
    (assert (value ?out (- 1 ?x)))
)

(defrule xor-gate
    (xor-gate ?out ?a ?b)
    (value ?a ?x) (value ?b ?y)
    (test (binary ?x)) (test (binary ?y))
    =>
    (assert (value ?out (- (+ ?x ?y) (* 2 ?x ?y))))
)

; Composition: simply 'replace' the component with others.
(defrule half-adder
    ?f <- (half-adder ?sum ?carry ?a ?b)
    =>
    (retract ?f)
    (assert
        (xor-gate ?sum ?a ?b)
        (and-gate ?carry ?a ?b)
    )
)

; Sometimes, additional wiring is needed to connect intermediate components.
(defrule full-adder
    ?f <- (full-adder ?sum ?cout ?a ?b ?cin)
    =>
    (retract ?f)
    (bind ?hsum (gensym))    ; At §12.7.1, the 6.4.2 BPG says:
    (bind ?hco1 (gensym))    ; The gensym function returns a sequenced generated symbol that can be stored as
    (bind ?hco2 (gensym))    ; a single field. This is useful for slot values that need a simple identifier.
    (assert
        (half-adder ?hsum ?hco1 ?a ?b)
        (half-adder ?sum ?hco2 ?hsum ?cin)
        (or-gate ?cout ?hco1 ?hco2))
    )

; Only a 2-bit RCA to keep it simple
(deffacts circuit
    (value a1 0)
    (value b1 1)
    (value a0 1)
    (value b0 1)
    (value c0 1)
    (full-adder o0 c1 a0 b0 c0)
    (full-adder o1 c2 a1 b1 c1)
)

(defrule result (declare (salience -1))
    ; inputs
    (value a1 ?a1)
    (value b1 ?b1)
    (value a0 ?a0)
    (value b0 ?b0)
    (value c0 ?c0)
    ; outputs
    (value c2 ?o2)
    (value o1 ?o1)
    (value o0 ?o0)
    =>
    (println "Result: 2("?a1" + "?b1") + 1("?a0" + "?b0") + "?c0" = 4*"?o2" + 2*"?o1" + 1*"?o0)
)

(reset)
(run)
