package com.vericure.vericurebackend.repository;

import com.vericure.vericurebackend.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Admin> findByStatus(String status);
}
