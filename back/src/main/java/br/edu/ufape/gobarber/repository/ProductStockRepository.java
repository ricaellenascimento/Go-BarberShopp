package br.edu.ufape.gobarber.repository;

import br.edu.ufape.gobarber.model.Product;
import br.edu.ufape.gobarber.model.ProductStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.List;

public interface ProductStockRepository extends JpaRepository <ProductStock, Integer> {
    Page<ProductStock> findByProduct(Product product, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ps FROM ProductStock ps WHERE ps.product.id = :productId ORDER BY ps.acquisitionDate ASC, ps.idStock ASC")
    List<ProductStock> findByProductIdForUpdate(@Param("productId") Integer productId);
}
